import glob from "glob";
import fs from "fs";

const articles = {
  index: "articles/index.md",
};

function generateJsNameFromFileName(fileName) {
  return fileName.replace(/\.md$/, "").replace(/\//g, "_").replace(/-/g, "_");
}

function generateImports(varName, files) {
  const imports = files
    .map((file) => {
      return `import ${generateJsNameFromFileName(file)} from '../../${file}';`;
    })
    .join("\n");
  const variable = `export const ${varName} = [${files
    .map((file) => generateJsNameFromFileName(file))
    .join(",")}];\n`;
  return imports + "\n" + variable;
}

function generateImport(varName, file) {
  const importStmt = `import ${generateJsNameFromFileName(
    file
  )} from '../../${file}';`;
  const variable = `export const ${varName} = ${generateJsNameFromFileName(
    file
  )};`;
  return importStmt + "\n" + variable;
}

export function generate() {
  glob("articles/blog/*.md", (_, files) => {
    articles.blogs = files;
    glob("articles/diary/*.md", (_, files) => {
      articles.diaries = files;
      fs.writeFileSync(
        "lib/generated/articles.ts",
        [
          "/* eslint camelcase: 0 */",
          "/* eslint import/first: 0 */",
          generateImports("blogs", articles.blogs),
          generateImports("diaries", articles.diaries),
          generateImport("index", articles.index),
        ].join("\n")
      );
    });
  });
}

generate();
