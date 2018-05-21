const database = process.argv[2];
console.log('Cleaning up:', database);

const cradle = require('cradle');

cradle.setup({
  host: 'localhost',
  port: 5984,
  auth: { username: '', password: '' },
});

const db = new (cradle.Connection)().database(database);

/* Delete non-design documents in a database. */
db.all((err, doc) => {
  /* Loop through all documents. */
  for (let i = 0; i < doc.length; i += 1) {
    /* Don't delete design documents. */
    if (doc[i].id.indexOf('_design') === -1) {
      db.remove(doc[i].id, doc[i].value.rev, (err2, doc2) => {
        console.log(doc2);
      });
    }
  }

  console.log('Done!');
});
