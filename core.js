const cf = require('crossref');
const request = require('request');

lastSearchQuery = {};

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
  }
};
