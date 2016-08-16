# mongo-table-admin (MTA)

Admin interface for mongo. Work with documents as table rows. Integrates [Handsontable](https://handsontable.com/) - great inline edit tool, and [Pivottable](https://github.com/nicolaskruchten/pivottable) - data discovery and analisys tool.

### why

For me, data collection is usually not just a valid json. You can say I'm an old style, but I'd like to understand data structure, trends, clusters etc. Thats what pivot is about. And second thing, I used to fix data easyly when I see small problems. Not like a SQL query, but inlide edit - just like Excel table or Google spreadsheet.

If you are looking for a full featured mongo admin, please check:
* [admin-mongo](https://www.npmjs.com/package/admin-mongo)
* [mongoclient](http://www.mongoclient.com/)

Rememeber to always back up important data. Everybody can sometimes unintentionally break something.

### [try demo on heroku](https://mongo-table-admin.herokuapp.com/)

Don't have local mongodb or one with secure url access? Get 500MB free on [mLabs](https://mlab.com/) 

### features

* Browse, analyze documents using Pivottable - group by rows, columns. Build graphs, export small datasets.
* Inline edit using Handsontable. Add new rows. Delete rows. Add or modify columns. Filter collection by regular query. 
* Create new collection copy-pasting data from any source. Set data type - Numeral, Boolean, Array, Object, Date. String is by default.
* Upload data from xls, xlsx, csv, json, and those zipped.

### installation
git clone https://github.com/artbels/mongo-table-admin.git && cd mongo-table-admin  
npm start  
[localhost:12369](http://localhost:12369)


### security
ip control by setting list of IPs in MTA_IPS environment variable  
export MTA_IPS=


### usage

[add rows (localhost:12369/create)](http://localhost:12369/create) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=_vUlAHl9uUU
" target="_blank"><img src="http://img.youtube.com/vi/_vUlAHl9uUU/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

[browse data (localhost:12369)](http://localhost:12369) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=eg8KG5Xw3Rc
" target="_blank"><img src="http://img.youtube.com/vi/eg8KG5Xw3Rc/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

[inline edit data (localhost:12369)](http://localhost:12369) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=IkbTDQo2VwM
" target="_blank"><img src="http://img.youtube.com/vi/IkbTDQo2VwM/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

### plans
- [x] build query in modal to save space
- [x] display autosave status
- [x] choose collection from list
- [x] show warning if too many documents in collection - choose how many to show or limit by query
- [x] router - collection in url, type of view, simple filters 
- [x] set data type on save
- [x] upload data from json, csv, xls, xlsx and those zipped
- [ ] test, test, test

### contribution & help

* be free to fork [github.com/artbels/mongo-table-admin](https://github.com/artbels/mongo-table-admin). Ex. configure basic auth.
* pull requests are welcome - the code is not great yet, handsontable helper functions need refactoring.
* found something broken? Take a minute to [post an issue](https://github.com/artbels/mongo-table-admin/issues).
* **don't be shy to star my first open source experiment - I promise to smile every time I see it ))**