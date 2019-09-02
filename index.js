require('dotenv').config();

const cf = require('crossref');
const inquirer = require('inquirer');
const commander = require('commander');
const core = require("./core.js")
const program = new commander.Command();
program.version('1.0.0')
       .description("A command tool to work with scientfic papers");

program
  .option('-f, --full-response', 'return the full response')
  .option('-d, --doi <DOI>', 'search by DOI')
  .option('-b, --bib', 'return bib')
  .option('-q, --query <query>', 'search by using the provide string query')
  .option('-i, --interactive', 'interactive query')
  .option('--ls', 'show local papers');

program.parse(process.argv);

let opts = program.opts();
//console.log(opts);

let filterDOI = function(data){
  if(data.title){
    if(opts.fullResponse){
      console.log(data);
    } else {
      console.log(data.title[0]);
      let authors = "";
      data.author.forEach((a)=>{
        authors += a.given + " " + a.family + "; ";
      });
      console.log(authors);
      console.log(data['container-title'][0]);
      console.log(data.link[0].URL);
      console.log(process.env.DOIRESOLVER + "/" + data.DOI)
    }
  }
}

let filterQuery = function(objs){
  if(objs){
    if(opts.fullResponse){
      //console.dir(objs, { depth: null });
      console.log(JSON.stringify(objs));
    } else {
      objs.forEach((data)=>{
        if(!data.title || !data.author || !data.link) return 0;
        console.log(data.title[0]);
        let authors = "";
        data.author.forEach((a)=>{
          authors += a.given + " " + a.family + "; ";
        });
        console.log(authors);
        console.log(data['container-title'][0]);
        console.log(data.link[0].URL);
        console.log(process.env.DOIRESOLVER + "/" + data.DOI)
        console.log("");
      });
    }
  }
}

if(opts.doi){ //searching for a DOI.
  if(opts.bib){
    core.getBibFromDoi(opts.doi).then(console.log);
    return 0;
  }
  core.getDataFromDOI(opts.doi).then((data)=>{
    filterDOI(data);
  }).catch(console.error);
} else if (opts.query) {
  core.queryWorks(opts.query).then((objs)=>{
    filterQuery(objs);
  });
} else if (opts.interactive) {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  inquirer
  .prompt([
    {
      type: 'autocomplete',
      name: 'query',
      suggestOnly: false,
      message: 'Query Search?',
      source: core.searchQuery,
      pageSize: 10,
    },
  ])
  .then(function(answers) {
    filterQuery([core.choosenQuery(answers.query)]);
  });
}
