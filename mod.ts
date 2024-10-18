// mod.ts

// Force to false and smart code compressors can remove the resulting 'dead code':
const DEBUG = true;

/**
 * Compile the given `.gitignore` content (not filename!)
 * and return an object with `accepts`, `denies` and `inspects` methods.
 * These methods each accepts a single filename or path and determines whether
 * they are acceptable or unacceptable according to the `.gitignore` definition.
 *
 * @param  {string} content The `.gitignore` content to compile.
 * @return {Object}         The helper object with methods that operate on the compiled content.
 */
export function compile(content: string): {
  diagnose: (query: any) => void;
  accepts: (input: string, expected?: boolean) => boolean;
  denies: (input: string, expected?: boolean) => boolean;
  inspects: (input: string, expected?: boolean) => boolean;
} {
  const parsed = parse(content);
  const positives = parsed[0];
  const negatives = parsed[1];

  return {
    diagnose: function (query: any) {
      if (DEBUG) {
        console.log(`${query.query}:`, query);
      }
    },
    accepts: function (input: string, expected?: boolean) {
      if (input[0] === "/") input = input.slice(1);
      input = "/" + input;

      const acceptRe = negatives[0];
      const acceptTest = acceptRe.test(input);
      const denyRe = positives[0];
      const denyTest = denyRe.test(input);
      let returnVal = acceptTest || !denyTest;

      let acceptMatch: RegExpExecArray | null = null;
      let denyMatch: RegExpExecArray | null = null;
      if (acceptTest && denyTest) {
        for (const re of negatives[1]) {
          const m = re.exec(input);
          if (m) {
            if (!acceptMatch || acceptMatch[0].length < m[0].length) {
              acceptMatch = m;
            }
          }
        }
        for (const re of positives[1]) {
          const m = re.exec(input);
          if (m) {
            if (!denyMatch || denyMatch[0].length < m[0].length) {
              denyMatch = m;
            }
          }
        }

        if (acceptMatch && denyMatch) {
          returnVal = acceptMatch[0].length >= denyMatch[0].length;
        }
      }

      if (expected != null && expected !== returnVal) {
        this.diagnose({
          query: "accepts",
          input,
          expected,
          acceptRe,
          acceptTest,
          acceptMatch,
          denyRe,
          denyTest,
          denyMatch,
          combine: "(Accept || !Deny)",
          returnVal,
        });
      }
      return returnVal;
    },
    denies: function (input: string, expected?: boolean) {
      if (input[0] === "/") input = input.slice(1);
      input = "/" + input;

      const acceptRe = negatives[0];
      const acceptTest = acceptRe.test(input);
      const denyRe = positives[0];
      const denyTest = denyRe.test(input);
      let returnVal = !acceptTest && denyTest;

      let acceptMatch: RegExpExecArray | null = null;
      let denyMatch: RegExpExecArray | null = null;
      if (acceptTest && denyTest) {
        for (const re of negatives[1]) {
          const m = re.exec(input);
          if (m) {
            if (!acceptMatch || acceptMatch[0].length < m[0].length) {
              acceptMatch = m;
            }
          }
        }
        for (const re of positives[1]) {
          const m = re.exec(input);
          if (m) {
            if (!denyMatch || denyMatch[0].length < m[0].length) {
              denyMatch = m;
            }
          }
        }

        if (acceptMatch && denyMatch) {
          returnVal = acceptMatch[0].length < denyMatch[0].length;
        }
      }

      if (expected != null && expected !== returnVal) {
        this.diagnose({
          query: "denies",
          input,
          expected,
          acceptRe,
          acceptTest,
          acceptMatch,
          denyRe,
          denyTest,
          denyMatch,
          combine: "(!Accept && Deny)",
          returnVal,
        });
      }
      return returnVal;
    },
    inspects: function (input: string, expected?: boolean) {
      if (input[0] === "/") input = input.slice(1);
      input = "/" + input;

      const acceptRe = negatives[0];
      const acceptTest = acceptRe.test(input);
      const denyRe = positives[0];
      const denyTest = denyRe.test(input);
      const returnVal = acceptTest || denyTest;

      if (expected != null && expected !== returnVal) {
        this.diagnose({
          query: "inspects",
          input,
          expected,
          acceptRe,
          acceptTest,
          denyRe,
          denyTest,
          combine: "(Accept || Deny)",
          returnVal,
        });
      }
      return returnVal;
    },
  };
}

/**
 * Parse the given `.gitignore` content and return an array
 * containing positives and negatives.
 * Each of these in turn contains a regexp which will be
 * applied to the 'rooted' paths to test for *deny* or *accept*
 * respectively.
 *
 * @param  {string} content  The content to parse,
 * @return {[RegExp, RegExp[]][]]}         The parsed positive and negatives definitions.
 */
export function parse(content: string): [RegExp, RegExp[]][] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line[0] !== "#")
    .reduce(
      (lists: [string[], string[]], line) => {
        const isNegative = line[0] === "!";
        if (isNegative) {
          line = line.slice(1);
        }
        if (isNegative) {
          lists[1].push(line);
        } else {
          lists[0].push(line);
        }
        return lists;
      },
      [[], []],
    )
    .map((list) => {
      list = list.sort().map(prepareRegexPattern);

      if (list.length > 0) {
        return [
          new RegExp("(?:" + list.join(")|(?:") + ")"),
          list.map((re) => new RegExp(re)),
        ];
      }
      return [new RegExp("$^"), []];
    });
}

function prepareRegexPattern(pattern: string): string {
  let input = pattern;
  let re = "";
  let rooted = false;
  let directory = false;
  if (pattern[0] === "/") {
    rooted = true;
    pattern = pattern.slice(1);
  }
  if (pattern[pattern.length - 1] === "/") {
    directory = true;
    pattern = pattern.slice(0, pattern.length - 1);
  }
  const rangeRe = /^((?:[^\[\\]|(?:\\.))*)\[((?:[^\]\\]|(?:\\.))*)\]/;
  let match: RegExpExecArray | null;

  while ((match = rangeRe.exec(pattern)) !== null) {
    if (match[1].split("").filter((x) => x === "/").length) {
      rooted = true;
    }
    re += transpileRegexPart(match[1]);
    re += "[" + match[2] + "]";

    pattern = pattern.slice(match[0].length);
  }
  if (pattern) {
    if (pattern.split("").filter((x) => x === "/").length) {
      rooted = true;
    }
    re += transpileRegexPart(pattern);
  }

  if (rooted) {
    re = "^\\/" + re;
  } else {
    re = "\\/" + re;
  }
  if (directory) {
    re += "\\/";
  } else {
    re += "(?:$|\\/)";
  }

  if (DEBUG) {
    try {
      new RegExp("(?:" + re + ")");
    } catch (ex) {
      console.log("failed regex:", { input, re, ex });
    }
  }
  return re;

  function transpileRegexPart(re: string): string {
    return re
      .replace(/\\(.)/g, "$1")
      .replace(/[\-\[\]\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
      .replace(/\?/g, "[^/]")
      .replace(/\/\*\*\//g, "(?:/|(?:/.+/))")
      .replace(/^\*\*\//g, "(?:|(?:.+/))")
      .replace(/\/\*\*$/g, () => {
        directory = true;
        return "(?:|(?:/.+))";
      })
      .replace(/\*\*/g, ".*")
      .replace(/\/\*(\/|$)/g, "/[^/]+$1")
      .replace(/\*/g, "[^/]*")
      .replace(/\//g, "\\/");
  }
}
