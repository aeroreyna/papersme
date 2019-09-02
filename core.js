const cf = require('crossref');
const request = require('request');

//this are required for local files
const bibtexParse = require('bibtex-parse-js');
const fs = require('fs');
const path = require('path');
const doi2bib = require('doi2bib');
const util = require('util');
const fusejs = require('fuse.js');
//Promisify fs
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

lastSearchQuery = {};

const getLocalWorks = async (pathFolder)=>{
    doi2bib.setLibraryFile(pathFolder + "library.bib")
    let files = await readdir(pathFolder)

    //get files stats
    let proms = [];
    let filesWithStats = {}
    files.forEach((file)=>{
      if(path.extname(file) === ".pdf"){
        let basename = path.basename(file, '.pdf').replace(/@/g, "/");
        if(!filesWithStats[basename]) filesWithStats[basename] = {};
        proms.push(stat(pathFolder + file).then((s)=>{
          filesWithStats[basename].stat = s.Stats
        }));
      }
      if(path.extname(file) === ".md"){
        let basename = path.basename(file, '.md').replace(/@/g, "/");
        if(!filesWithStats[basename]) filesWithStats[basename] = {};
        filesWithStats[basename].notes = file;
        proms.push(stat(pathFolder + file).then((s)=>{
          filesWithStats[basename].notesStat = s.Stats
        }));
      }
    });
    await Promise.all(proms)

    //adds bibliography
    await doi2bib.updateFromArray(Object.keys(filesWithStats)) //updates bib file
    if(fs.existsSync(pathFolder + "library.bib")){
      let content = await readFile(pathFolder + "library.bib", 'utf8');
      let bibs = bibtexParse.toJSON(content);
      //console.log(bibs)
      bibs.forEach((bib)=>{
        d = bib.entryTags.doi;
        if(filesWithStats[d]){
          filesWithStats[d].bib = bib;
        }
      });
    }

    return filesWithStats;
}

module.exports = {
  getDataFromDOI(doi){
    return new Promise((resolve, reject)=>{
      cf.work(doi, (err, data)=>{
        if(err) reject(err);
        resolve(data);
      });
    });
  },
  queryWorks(query, rows){
    rows = rows ? rows : 10;
    return new Promise((resolve, reject)=>{
      cf.works({query, rows}, (err, objs, nextOpts, done)=>{
        if(err) reject(err);
        resolve(objs);
      });
    });
  },
  getBibFromDoi(doi){
    return new Promise((resolve, reject)=>{
      request({
        url: 'http://dx.doi.org/' + doi,
        headers: {'Accept': 'application/x-bibtex'}
      }, (error, response, body) =>{
        if (!error && response.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  },
  searchQuery(answers, input) {
    input = input || 'a';
    return new Promise(function(resolve) {
      cf.works({ query: input, rows: 10 }, (err, objs, nextOpts, done) => {
        lastSearchQuery = objs;
        let ans = [];
        if(objs){
          objs.forEach((data)=>{
            if(!data.title || !data.author || !data.link) return 0;
            ans.push(data.title[0])
          });
        }
        resolve(ans);
      });
    });
  },
  choosenQuery(title){
    let ans = {};
    lastSearchQuery.forEach((data)=>{
      if(!data.title || !data.author || !data.link) return 0;
      if(data.title[0] == title){
        ans = data;
      }
    });
    return ans;
  },
  getLocalWorks(path){
    return getLocalWorks(path);
  }
};
