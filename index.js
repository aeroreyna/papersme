require('dotenv').config();

const cf = require('crossref');
const inquirer = require('inquirer');
const commander = require('commander');
const program = new commander.Command();
program.version('1.0.0')
       .description("A command tool to work with scientfic papers");

program
  .option('-f, --full-response', 'return the full response')
  .option('-d, --doi <DOI>', 'search by DOI')
  .option('-q, --query <query>', 'search by using the provide string query')
  .option('--ls', 'show local papers');

  program.parse(process.argv);

let opts = program.opts();
console.log(opts);

//crossRef.works({ query: searchString, rows: 1 }, (err, objs, nextOpts, done) => {

if(opts.doi){ //searching for a DOI.
  cf.work(opts.doi, (err, data)=>{
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
  });
} else if (opts.query) {
  cf.works({ query: opts.query, rows: 10 }, (err, objs, nextOpts, done) => {
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
  });
}
