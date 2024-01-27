#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Marked } from 'marked';
import { closify, entify } from 'htmlfy'
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';

//
// init
//

// for syntax highlighting in code blocks
const marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    })
  );

marked.use(gfmHeadingId());

// paths
const __dirname = path.resolve();
const buildPath = path.join(__dirname, 'docs');
const assetsPath = path.join(__dirname, 'assets');
const vanConePath = path.join(__dirname, 'van-cone');

const build = (filePath) => path.join(buildPath, filePath);
const asset = (filePath) => path.join(assetsPath, filePath);
const vanCone = (filePath) => path.join(vanConePath, filePath);

const vanConePackage = JSON.parse(fs.readFileSync(vanCone('package.json'), 'utf-8'));

//
// convert link address when parsing markdown
//

const linkMap = {
    './getting-started.md': 'getting-started.html',
    './routing-and-nav-guide.md': 'routing-and-nav-guide.html',
    './component-guide.md': 'component-guide.html',
    './api-reference.md': 'api-reference.html'
}

let linkPrefix = './';

// Override function
const walkTokens = (token) => {
    
    if (token.type === 'link') {
        if (token.href.startsWith('http')) return;

        // format urls to be relative to the root and point to .html insted of .md files
        Object.keys(linkMap).forEach(key => {
            token.href = token.href.replace(key, linkPrefix + linkMap[key])
        })

        // console.log('found link: ', token.href, newHref);
    }

    
  };
  
marked.use({ walkTokens });


//
// render functions
//

let allClassNames = [];

const renderPage = (sourcePath, outputPath, pageTitle) => {
    // parse and remove the most common zerowidth characters from the start of the file
    const source = fs.readFileSync(sourcePath, 'utf-8');
    const body = marked.parse(source.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="./style.css" />
</head>
<body>
    <img id="van-logo-right-side" src="./img/logo-615x892.png" alt="Van Cone Logo" />   
    <div id="sidebar">
        <a href="./"><h1>Van Cone</h1></a>
        <a id="van-logo-sidebar" href="./">
            <img id="van-logo-sidebar-img" src="./img/logo-308x446.png" alt="Van Cone Logo" />
        </a>
        <ul>
            <li><a href="./getting-started.html">Getting Started</a></li>
            <li><a href="./routing-and-nav-guide.html">Routing and Nav Guide</a></li>
            <li><a href="./component-guide.html">Component Guide</a></li>
            <li><a href="./api-reference.html">API Reference</a></li>
            <li><a href="https://github.com/medium-tech/van-cone/tree/main/examples" target="_blank">Examples</a></li>
            <li><a href="https://github.com/b-rad-c/van-cone" target="_blank">Source code</a></li>
            <li><a href="https://www.npmjs.com/package/van-cone" target="_blank">npm package</a></li>
        </ul>
    </div>
    <div id="content">
        ${body}
    </div>
</body>`;

    const output = closify(entify(html))
    
    // @ts-ignore
    const classNames = output.match(/class="[^"]*"/g).map(match => match.replace(/class="([^"]*)"/g, '$1'))
    if (classNames !== null) allClassNames.push(...classNames)

    // write to file
    const outputPathFull = build(outputPath);

    // ensure output directory exists
    const outputDir = path.dirname(outputPathFull);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPathFull, output, 'utf-8');
}

//
// execute build
//

renderPage(vanCone('docs/api-reference.md'), linkPrefix + 'api-reference.html', 'Van Cone | API Documentation');
renderPage(vanCone('docs/routing-and-nav-guide.md'), linkPrefix + 'routing-and-nav-guide.html', 'Van Cone | Routing and Nav Guide');
renderPage(vanCone('docs/component-guide.md'), linkPrefix + 'component-guide.html', 'Van Cone | Component Guide');
renderPage(vanCone('docs/getting-started.md'), linkPrefix + 'getting-started.html', 'Van Cone | Getting Started');

fs.writeFileSync(build(linkPrefix + 'version.txt'), vanConePackage.version, { encoding: 'utf-8', flag: 'w+'});

fs.copyFileSync(asset('./index.html'), build('index.html'));
fs.copyFileSync(asset('./style.css'), build('style.css'));

if (!fs.existsSync(build('img'))) fs.mkdirSync(build('img'));
fs.copyFileSync(asset('./img/logo-615x892.png'), build('./img/logo-615x892.png'));
fs.copyFileSync(asset('./img/logo-308x446.png'), build('./img/logo-308x446.png'));

// find all syntax highlighting class names
const uniqueClassNames = [...new Set(allClassNames)];
const hslsClassNames = uniqueClassNames.filter(className => className.includes('hljs'));
// console.log(hslsClassNames);

console.log(`Van Cone ${vanConePackage.version} website build complete!`)
