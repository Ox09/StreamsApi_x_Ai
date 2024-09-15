"use client";
import React, {
  createElement,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";

interface FootNoteProps {
  refId: any;
  text: string;
}
interface ParsedTextProps {
  input?: string;
  type: "ai" | "user";
  setFootNotes?: Dispatch<SetStateAction<FootNoteProps[]>>;
}

const MarkdownFormatter = ({ setFootNotes, input, type }: ParsedTextProps) => {
  const elements: ReactNode[] = [];

  const format = ({ line, index }: { line: string; index: number }) => {
    let match: RegExpExecArray | null = null;
    // Regex patterns
    const headingRegex = /^(\s*#{1,6}\s*)\s*(.+?)$/gm;
    const strikethrough = /^\s*~~(.*?)~~\s*$/;
    const codeBlock = /`([^`]+)`/g;
    const boldFullTextSelection = /\*\*([^*]*?)\*\*/; //
    const italicFullTextSelection = /(\*|_)([\s\S]*?)\1/g;
    const boldWithMultiLineRegex = /(?<!\w)(\*\*|__)([\s\S]+?)\1\s*(?!\w)/gm;
    const italicWithMultiLineRegex =
      /(?<![\*_])([\*_])(?!\1)([\s\S]+?)\1(?![\*_])/gm;
    const unorderedListRegex = /^[\-\*\+]\s+(.+)/gm;
    const orderedListRegex = /^\s*\d+\s*\.\s*.*$/;
    const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/gm;
    const urlRegex = /https?:\/\/[^\s\/$.?#].[^\s]*/gm;
    const partialCodePattern = /```(\w+)/;
    const blockquoteRegex = /^>\s+(.+)/;
    const footnoteRegex = /(?:\^\[([^\]]+)\])|(?:\[\^([^\]]+)\])/gm;
    const htmlCssJsCommentsRegex =
    /\/\s*\*\s*([\s\S]*?)\s*\*\s*\/|\/\/\s*(.*?)\s*(?:\n|$)|<!--\s*([\s\S]*?)\s*-->/g;
    const symbolsOnlyRegex = /^[^\w\s]+$/gm;

    // For Headings
    if ((match = headingRegex.exec(line)) !== null) {
      const headingLevel = match[1].length;
      const headingClasses: Record<number, string> = {
        1: "text-4xl font-bold",
        2: "text-3xl font-semibold",
        3: "text-2xl font-medium",
        4: "text-xl font-medium",
        5: "text-lg font-medium",
        6: "text-base font-medium",
      };

      return createElement(
        `h${headingLevel}`,
        { key: index, className: headingClasses[headingLevel] },
        match[2]
      );
    }
    // Check for Code  blocks
    if ((match = codeBlock.exec(line)) !== null) {
      let m;
      const arr: ReactNode[] = [];
      let lastIndex = 0;

      // Ensure the regex has the global flag
      const regex = new RegExp(codeBlock, "g");

      // Loop through all matches
      while ((m = regex.exec(line)) !== null) {
        const p2 = m[1]; // Extracted part

        // Add the part of the line before the current match
        const firstPart = line.substring(lastIndex, m.index);
        arr.push(firstPart);

        // Add the formatted match
        arr.push(
          createElement(
            "code",
            {
              className: `px-1 py-0.5 rounded ${
                type === "ai" ? "bg-[#e1d8cc]" : "bg-[#19596f]"
              }`,
            },
            p2.trim()
          )
        );

        // Update the lastIndex for the next iteration
        lastIndex = regex.lastIndex;
      }

      // Add any remaining line after the last match
      if (lastIndex < line.length) {
        arr.push(line.substring(lastIndex));
      }

      // Create the final line outside the loop
      return createElement("p", { className: "line-bs" }, arr);
    }

    // Check for Bold including italic texts
    if ((match = boldFullTextSelection.exec(line)) !== null) {
      let m;
      const arr: ReactNode[] = [];
      let lastIndex = 0;
      const italicRegex = new RegExp(italicWithMultiLineRegex);
      // Check if the line contains italic text inside bold
      if (italicRegex.test(line)) {
        while ((m = italicWithMultiLineRegex.exec(match[1])) !== null) {
          // Push text between the last index and the current italic match
          arr.push(match[1].substring(lastIndex, m.index));

          // Push the italic text wrapped in <em> tags
          arr.push(createElement("em", { classname: "font-normal" }, m[2]));

          // Update the lastIndex to the end of the current match
          lastIndex = italicWithMultiLineRegex.lastIndex;
        }

        // Push any remaining text after the last italic match
        arr.push(match[1].substring(lastIndex));
        match = null;
        // Wrap the entire array in <strong> to represent the bold text
        return createElement("strong", null, arr);
      }
      // If there's no italic text, just return the bold text
      return createElement(
        "strong",
        null,
        line.replace(boldFullTextSelection, match[1])
      );
    }

    // Check for Italic including bold texts
    if ((match = italicWithMultiLineRegex.exec(line)) !== null) {
      let m;
      const arr: ReactNode[] = [];
      let lastIndex = 0;
      const boldRegex = new RegExp(boldWithMultiLineRegex);
      // Check if the line contains bold text inside italic
      if (boldRegex.test(line)) {
        while ((m = boldWithMultiLineRegex.exec(match[2])) !== null) {
          // Push text between the last index and the current bold match
          arr.push(match[2].substring(lastIndex, m.index));

          // Push the bold text wrapped in <strong> tags
          arr.push(createElement("strong", null, m[2]));

          // Update the lastIndex to the end of the current match
          lastIndex = boldWithMultiLineRegex.lastIndex;
        }

        // Push any remaining text after the last bold match
        arr.push(match[2].substring(lastIndex));

        // Wrap the entire array in <em> to represent the italic text
        return createElement("em", null, arr);
      }

      // If there's no bold text, just return the italic text
      return createElement(
        "em",
        null,
        line.replace(italicFullTextSelection, match[2])
      );
    }

    // Check for unordered list
    if ((match = unorderedListRegex.exec(line)) !== null) {
      return createElement(
        "ul",
        { className: "list-disc pl-6" },
        createElement("li", null, match[1])
      );
    }

    // Check for ordered list
    if ((match = orderedListRegex.exec(line)) !== null) {
      return createElement(
        "ol",
        { className: "list-decimal pl-6" },
        createElement("li", null, match[0])
      );
    }

    // Check for link
    if ((match = linkRegex.exec(line)) !== null) {
      return createElement(
        "a",
        {
          href: match[2],
          target: "_blank",
          className:
            "cursor-pointer underline decoration-rose-500 decoration-2 hover:text-rose-600",
        },
        match[1]
      );
    }

    // Check for URL
    if ((match = urlRegex.exec(line)) !== null) {
      return createElement(
        "a",
        {
          href: match[1],
          target: "_blank",
          className: "text-blue-500 underline",
        },
        match[1]
      );
    }

    // Check for Comments (html, css, js)
    if ((match = htmlCssJsCommentsRegex.exec(line)) !== null) {
      let m;
      const arr: ReactNode[] = [];
      let lastIndex = 0;
      const content = match[1] || match[2] || match[3];
      // Ensure the regex has the global flag
      const regex = new RegExp(htmlCssJsCommentsRegex, "g");
      while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0]; // Entire matched comment including delimiters
        const content = match[1] || match[2] || match[3]; // Extract content based on the match group

        // Add the part of the line before the current match
        const firstPart = line.substring(lastIndex, match.index);
        arr.push(firstPart);

        // Add the formatted match with delimiters preserved
        arr.push(
          createElement(
            "span",
            { className: "text-[#6b8e23] font-medium  px-1 py-0.5 " },
            fullMatch.trim()
          )
        );

        // Update the lastIndex for the next iteration
        lastIndex = regex.lastIndex;
      }

      // Add any remaining line after the last match
      if (lastIndex < line.length) {
        arr.push(line.substring(lastIndex));
      }

      // Create the final line outside the loop
      return createElement("p", { className: "line-bs" }, arr);
    }

    // Check for blockquote
    if ((match = blockquoteRegex.exec(line)) !== null) {
      return createElement(
        "blockquote",
        { className: "border-l-4 border-gray-300 pl-4 italic" },
        match[1]
      );
    }

    // Check for footnote
    if ((match = footnoteRegex.exec(line)) !== null) {
      // Regex for both footnote formats
      const footnoteRegex = /(?:\^\[([^\]]+)\])|(?:\[\^([^\]]+)\])/g;

      // Find and process all footnotes
      const footnotes: { refId: string; text: string }[] = [];
      const formattedLine = line.replace(footnoteRegex, (match, p1, p2) => {
        const footnoteText = p1 || p2;
        const footnoteNumber = p1 ? p1.trim() : p2.trim();
        if (setFootNotes) {
          footnotes.push({ refId: footnoteNumber, text: footnoteText });
        }
        return `<div class="line-sm line-gray-500 mt-2">${footnoteText}<sup class="text-xs text-blue-500">[${footnoteNumber}]</sup></div>`;
      });

      // Update footnotes state if needed
      if (setFootNotes && footnotes.length) {
        setFootNotes((prev) => [...prev, ...footnotes]);
      }

      return formattedLine;
    }

    // Check for Strikethrough (double tildes)
    if ((match = strikethrough.exec(line)) !== null) {
      return createElement(
        "del",
        { className: "line-through" },
        line.replace(strikethrough, "$1")
      );
    }

    // Check for code blocks (partial match)
    if ((match = partialCodePattern.exec(line)) !== null) {
      return createElement(
        "div",
        {
          className: "bg-slate-600 rounded-sm text-white px-2 py-1 capitalize",
        },
        match[1]
      );
    }

    if (line.endsWith("```")) {
      return createElement("div", { className: "bg-black h-[2px]" }, null);
    }

    // Check for only symbols
    // if (symbolsOnlyRegex.test(line)) {
    //   return null;
    // }

    // Default to plain paragraph if no patterns matched
    return createElement(
      "p",
      { key: index, className: "line-base whitespace-pre text-wrap" },
      line
    );
  };

  if (input) {
    input
      ?.split("\n")
      .forEach((line, index) => elements.push(format({ line, index })));

    return <div className="flex flex-col gap-1 leading-[22px]">{elements}</div>;
  }

  return null; // Return null or a fallback if lines is undefined or empty
};

export default MarkdownFormatter;
