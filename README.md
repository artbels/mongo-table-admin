# mongo-table-admin (MTA)

Admin interface for mongo, to work with documents as table rows. Integrates Handsontables, Pivottable. Handsontable is a great inline edit tool. Pivottable is data discovery and analisys tool.

### why

For me, data collection is usually not just a valid json. You can say I'm an old style, but I'd like to understand data structure, trends, clasters etc. Thats what pivot is about. And second thing, I used to fix data easyly when I see small problems. Not like a SQL query, but inlide edit - just like Excel table or Google spreadsheet.

If you are looking for a full featured mongo admin, please check:
* [admin-mongo](https://www.npmjs.com/package/admin-mongo)
* [mongoclient](http://www.mongoclient.com/)

### features

* Browse data using Pivottable
* Inline edit using Handsontable
* Create new table using copy-paste data from regular table. Set data type - Numeral, Boolean, Array, Object, Date. String is by default.

### installation
npm install  
npm start  
[localhost:12369](http://localhost:12369)

### usage

[add rows (localhost:12369/create)](localhost:12369/create) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=_vUlAHl9uUU
" target="_blank"><img src="http://img.youtube.com/vi/_vUlAHl9uUU/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

[browse data (localhost:12369)](localhost:12369) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=eg8KG5Xw3Rc
" target="_blank"><img src="http://img.youtube.com/vi/eg8KG5Xw3Rc/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

[inline edit data (localhost:12369)](localhost:12369) example on youtube:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=IkbTDQo2VwM
" target="_blank"><img src="http://img.youtube.com/vi/IkbTDQo2VwM/0.jpg" 
alt="add rows" width="480" height="270" border="10" /></a>

### plans
- [+] build query in modal to save space
- [+] display autosave status
- [+] choose collection from list
- [+] show warning if too many documents in collection - choose how many to show or limit by query
- [+] router - collection in url, type of view, simple filters 
- [ ] set data type on save
- [ ] upload data from json, csv, xls, xlsx and those zipped