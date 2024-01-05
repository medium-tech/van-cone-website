#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import { prettify, closify, entify } from 'htmlfy'
import { gfmHeadingId, getHeadingList } from 'marked-gfm-heading-id';


//
// init
//

marked.use(gfmHeadingId());

const __dirname = path.resolve();
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(__dirname, 'assets');
const vanConePath = path.join(__dirname, 'van/addons/van_cone');

const dist = (filePath) => path.join(distPath, filePath);
const asset = (filePath) => path.join(assetsPath, filePath);
const vanCone = (filePath) => path.join(vanConePath, filePath);

// import van cone package file
const vanConePackage = JSON.parse(fs.readFileSync(vanCone('package.json'), 'utf-8'));

//
// convert links when parsing md
//

const linkMap = {
    'API_REFERENCE': '/docs/API_REFERENCE.html',
    'COMPONENT_GUIDE': '/docs/COMPONENT_GUIDE.html'
}

// Override function
const walkTokens = (token) => {
    
    if (token.type === 'heading') {

        if(token.raw.includes('{')) {
            console.log(token)
            const replacement = token.raw.replaceAll(' = {}', '').replaceAll('`', '') // these characters mess up the heading ids
            token.raw = replacement;
            token.text = replacement;
            token.tokens[0].raw = replacement;
            token.tokens[0].text = replacement;
            console.log(token)
        }

    }else if (token.type === 'link') {
        let newHref = '-'

        if (token.href.startsWith('http')) return;
        //if (token.href.startsWith('#')) return; 

        // format link
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

const renderPage = (sourcePath, outputPath, pageTitle, indentLevel) => {
    // parse and remove the most common zerowidth characters from the start of the file
    const source = fs.readFileSync(sourcePath, 'utf-8');
    const parsed = marked.parse(source.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''));
    const indent = indentLevel ? '    '.repeat(indentLevel) : '';
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

    const output = prettify(closify(entify(html)));

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

renderPage(asset('INDEX.md'), 'index.html', 'Van Cone', 6);
renderPage(vanCone('docs/API_REFERENCE.md'), 'docs/API_REFERENCE.html', 'Van Cone | API', 6);
//console.log(getHeadingList());
renderPage(vanCone('docs/COMPONENT_GUIDE.md'), 'docs/COMPONENT_GUIDE.html', 'Van Cone | Component guide', 6);

fs.copyFileSync(asset('./style.css'), dist('style.css'));

console.log(`Van Cone ${vanConePackage.version} website build complete!`)

