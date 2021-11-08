import glob from "glob";
import fs from "fs";
import { exec, execSync } from "child_process";
import XMLWriter from "xml-writer";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import Yaml from "js-yaml";

// TODO analyze frontmatter and create sitemap for tags

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

function generateArticleSource(articles) {
  return [
    "/* eslint camelcase: 0 */",
    "/* eslint import/first: 0 */",
    generateImports("blogs", articles.blogs),
    generateImports("diaries", articles.diaries),
    generateImport("index", articles.index),
  ].join("\n");
}

function getLastUpdatedTime(path) {
  return execSync(
    `git log --date=iso --date=format:"%Y-%m-%d" --pretty=format:"%ad" -1 ${path}`
  ).toString();
}

function getCreatedTime(path) {
  return execSync(
    `git log --date=iso --date=format:"%Y-%m-%d" --pretty=format:"%ad" ${path} | tail -n 1`
  ).toString();
}

function compareDate(a, b) {
  const splitedA = a.split("/");
  const splitedB = b.split("/");
  for (let i = 0; i < 3; ++i) {
    if (splitedA[i] > splitedB[i]) {
      return true;
    } else if (splitedA[i] < splitedB[i]) {
      return false;
    }
  }
  return true;
}

function getIndexUpdatedTime(articles) {
  let last = getCreatedTime(articles[0]);
  for (let i = 0; i < articles.length; ++i) {
    if (compareDate(getLastUpdatedTime(articles[i]), last)) {
      last = getLastUpdatedTime(articles[i]);
    }
  }
  return last;
}

function getTags(blogs) {
  const tags = {};
  for (let i = 0; i < blogs.length; ++i) {
    const src = fs.readFileSync(blogs[i], "utf-8");
    const md = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ["yaml"])
      .use(remarkGfm)
      .parse(src);
    const yaml = Yaml.load(md.children[0].value);
    for (let j = 0; j < yaml.category.length; ++j) {
      if (tags[yaml.category[j]] === undefined) {
        tags[yaml.category[j]] = [blogs[i]];
      } else {
        tags[yaml.category[j]].push(blogs[i]);
      }
    }
  }
  return tags;
}

function addPage(xml, path, date) {
  xml.startElement("url");
  xml.startElement("loc");
  xml.text(`https://www.namachan10777.dev/${path}`);
  xml.endElement();
  xml.startElement("lastmod");
  xml.text(date);
  xml.endElement();
  xml.endElement();
}

function generateSiteMap(articles) {
  const xml = new XMLWriter();
  xml.startDocument();
  xml.startElement("urlset");
  xml.writeAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
  addPage(xml, "", getLastUpdatedTime(articles.index));
  addPage(xml, "blog", getIndexUpdatedTime(articles.blogs));
  addPage(xml, "diary", getIndexUpdatedTime(articles.diaries));
  for (let i = 0; i < articles.blogs.length; ++i) {
    addPage(xml, articles.blogs[i], getLastUpdatedTime(articles.blogs[i]));
  }
  for (let i = 0; i < articles.diaries.length; ++i) {
    addPage(xml, articles.diaries[i], getLastUpdatedTime(articles.diaries[i]));
  }
  const tags = getTags(articles.blogs);
  for (const tag in tags) {
    addPage(xml, `tag/${tag}`, getIndexUpdatedTime(tags[tag]));
  }
  xml.endElement();
  xml.endDocument();
  return xml.toString();
}

export function generate() {
  articles.blogs = glob.sync("articles/blog/*.md");
  articles.diaries = glob.sync("articles/diary/*.md");
  fs.writeFileSync(
    "lib/generated/articles.ts",
    generateArticleSource(articles)
  );
  fs.writeFileSync("public/sitemap.xml", generateSiteMap(articles));
}

generate();
