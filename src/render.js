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

const __dirname = path.resolve();
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(__dirname, 'assets');
const vanConePath = path.join(__dirname, 'van-cone');

const dist = (filePath) => path.join(distPath, filePath);
const asset = (filePath) => path.join(assetsPath, filePath);
const vanCone = (filePath) => path.join(vanConePath, filePath);

// import van cone package file
const vanConePackage = JSON.parse(fs.readFileSync(vanCone('package.json'), 'utf-8'));

//
// custom renderer
//

// function postprocess(html) {
//     console.log('postprocess');
//     // replace every </a> with "</a> "
//     //html = html.replace(/<\/a>/g, '</a>&nbsp;');
//     return html;

//   }
  
// marked.use({ hooks: { postprocess } });

//
// convert link address when parsing markdown
//

const linkMap = {
    'getting-started': '/getting-started.html',
    'api-reference': '/api-reference.html',
    'component-guide': '/component-guide.html'
}

// Override function
const walkTokens = (token) => {
    
    if (token.type === 'link') {
        let newHref = '-'

        if (token.href.startsWith('http')) return;

        // format urls to be relative to the root and point to .html insted of .md files
        Object.keys(linkMap).forEach(key => {
            if (token.href.includes(key)) {
                const [_, id] = token.href.split('#');
                if(typeof id === 'undefined') {
                    newHref = linkMap[key];
                }else{
                    newHref = `${linkMap[key]}#${id}`
                }
            }
        })

        // console.log('found link: ', token.href, newHref);
        if (newHref !== '-') token.href = newHref;
    }

    
  };
  
marked.use({ walkTokens });


//
// render functions
//

let allClassNames = [];

const renderPage = (sourcePath, outputPath, pageTitle, indentLevel) => {
    // parse and remove the most common zerowidth characters from the start of the file
    const source = fs.readFileSync(sourcePath, 'utf-8');
    const parsed = marked.parse(source.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''));
    const indent = indentLevel ? '    '.repeat(indentLevel) : '';
    // @ts-ignore
    const body = parsed.split('\n').map(line => `${indent}${line}`).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="/style.css" />
</head>
<body>
    <div class="container">
        <div class="content">
            ${body}
        </div>
    </div>
</body>`;

    const output = closify(entify(html))
    
    // find all class names
    // @ts-ignore
    const classNames = output.match(/class="[^"]*"/g).map(match => match.replace(/class="([^"]*)"/g, '$1'))
    if (classNames !== null) allClassNames.push(...classNames)

    // write to file
    const outputPathFull = dist(outputPath);

    // ensure output directory exists
    const outputDir = path.dirname(outputPathFull);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPathFull, output, 'utf-8');
}

//
// execute build
//

renderPage(vanCone('docs/INDEX.md'), 'index.html', 'Van Cone', 0);
renderPage(vanCone('docs/api-reference.md'), 'api-reference.html', 'Van Cone | API Documentation', 0);
renderPage(vanCone('docs/getting-started.md'), 'getting-started.html', 'Van Cone | Getting Started', 0);
renderPage(vanCone('docs/component-guide.md'), 'component-guide.html', 'Van Cone | Component Guide', 0);

fs.copyFileSync(asset('./style.css'), dist('style.css'));

const uniqueClassNames = [...new Set(allClassNames)];
const hslsClassNames = uniqueClassNames.filter(className => className.includes('hljs'));
console.log(hslsClassNames);

console.log(`Van Cone ${vanConePackage.version} website build complete!`)
