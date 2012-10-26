db.dropDatabase();
db.createCollection("users");
db.createCollection("comment");
db.createCollection("diary");
db.createCollection("tips");
db.createCollection("notebooks");
db.notebooks.insert({name:"默认日记",owner:-1});
