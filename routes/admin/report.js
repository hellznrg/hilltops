var express = require('express');
var router = express.Router();
var db = require("../../model/db");
var moment = require("moment-timezone");
var Promise = require("bluebird");

var Person = require("../../model/Person");
var Registration = require("../../model/Registration");
var TaskCompletion = require("../../model/TaskCompletion");
var TaskData = require("../../model/TaskData");

router.get("/", function (req, res, next) {
	res.render("admin/report");
});

router.get('/FlockDailyProduction', async function (req, res, next) {
	var data = await getFullData2();
	var result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"])
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Collection_Clean + _d.F3_Collection_Dirty, _d.F4_Collection_Clean + _d.F4_Collection_Dirty, _d.F5_Collection_Clean + _d.F5_Collection_Dirty,]);
	}
	res.send(result);
});

router.get('/FlockDailyProductionPerHen', async function (req, res, next) {
	var data = await getFullData2();
	var result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"])
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, (_d.F3_Collection_Clean + _d.F3_Collection_Dirty) / _d.F3_Pop_Current, (_d.F4_Collection_Clean + _d.F4_Collection_Dirty) / _d.F4_Pop_Current, (_d.F5_Collection_Clean + _d.F5_Collection_Dirty) / _d.F5_Pop_Current]);
	}
	res.send(result);
});

async function getFullData1() {
	return await db.query(`
select STRFTIME('%Y-%m-%d', CompletedAt) as CompletedAt, 
max(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F3_Collection_Clean,
max(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F4_Collection_Clean,
max(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F5_Collection_Clean,
max(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F3_Collection_Dirty,
max(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F4_Collection_Dirty,
max(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F5_Collection_Dirty,
max(case when t.Name = 'Hen population (flock 3)' and tdf.Name = 'How many live hens' then cast(Value as numeric) else null end) as F3_Pop,
max(case when t.Name = 'Hen population (flock 4)' and tdf.Name = 'How many live hens' then cast(Value as numeric) else null end) as F4_Pop,
max(case when t.Name = 'Hen population (flock 5)' and tdf.Name = 'How many live hens' then cast(Value as numeric) else null end) as F5_Pop,
max(case when t.Name = 'Mortality (flock 3)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F3_Mortality,
max(case when t.Name = 'Mortality (flock 4)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F4_Mortality,
max(case when t.Name = 'Mortality (flock 5)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F5_Mortality,
max(case when t.Name = 'Hy Line data (flock 3)' and tdf.Name = '% standard weekly Hy Line' then cast(Value as numeric) else null end) as F3_HyLine_Weekly,
max(case when t.Name = 'Hy Line data (flock 4)' and tdf.Name = '% standard weekly Hy Line' then cast(Value as numeric) else null end) as F4_HyLine_Weekly,
max(case when t.Name = 'Hy Line data (flock 5)' and tdf.Name = '% standard weekly Hy Line' then cast(Value as numeric) else null end) as F5_HyLine_Weekly,
max(case when t.Name = 'Hy Line data (flock 3)' and tdf.Name = 'Cumulative mortality % Hy Line' then cast(Value as numeric) else null end) as F3_HyLine_Mortality,
max(case when t.Name = 'Hy Line data (flock 4)' and tdf.Name = 'Cumulative mortality % Hy Line' then cast(Value as numeric) else null end) as F4_HyLine_Mortality,
max(case when t.Name = 'Hy Line data (flock 5)' and tdf.Name = 'Cumulative mortality % Hy Line' then cast(Value as numeric) else null end) as F5_HyLine_Mortality,

max(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl800_BCE,
max(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl800_CE,
max(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl800_E,
max(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa800_BCE,
max(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa800_CE,
max(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa800_E,

max(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl700_BCE,
max(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl700_CE,
max(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl700_BTE,
max(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl700_TE,
max(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl700_E,

max(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa700_BCE,
max(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa700_CE,
max(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa700_BTE,
max(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa700_TE,
max(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa700_E,

max(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl600_BCE,
max(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl600_CE,
max(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl600_BTE,
max(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl600_TE,
max(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl600_E,

max(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa600_BCE,
max(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa600_CE,
max(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa600_BTE,
max(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa600_TE,
max(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa600_E,

max(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClM_BCE,
max(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClM_CE,
max(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClM_E,
max(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaM_BCE,
max(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaM_CE,
max(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaM_E,

max(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClP_BCE,
max(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClP_CE,
max(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClP_E,
max(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaP_BCE,
max(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaP_CE,
max(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaP_E

from Tasks t, Registrations r
inner join TaskCompletions tc on t.id = tc.TaskId and tc.RegistrationId = r.id
inner join TaskDataFields tdf on t.id = tdf.TaskId
inner join TaskData td on tdf.id = td.TaskDataFieldId and td.TaskCompletionId = tc.id
group by STRFTIME('%Y-%m-%d', CompletedAt)
order by STRFTIME('%Y-%m-%d', CompletedAt)
	`);
}

var _full_data;

async function getFullData2(regen) {
	if (_full_data == null || regen) {
		var data = await getFullData1(), datamap = {};
		data = data[0];
		data.forEach(d => {
			datamap[d.CompletedAt] = d;
		});
		if (data[0]["F3_Pop"] != 0) data[0]["F3_Pop_Current"] = data[0]["F3_Pop"]; else data[0]["F3_Pop_Current"] = 0;
		if (data[0]["F4_Pop"] != 0) data[0]["F4_Pop_Current"] = data[0]["F4_Pop"]; else data[0]["F4_Pop_Current"] = 0;
		if (data[0]["F5_Pop"] != 0) data[0]["F5_Pop_Current"] = data[0]["F5_Pop"]; else data[0]["F5_Pop_Current"] = 0;

		for (counter = 1; counter < data.length; counter++) {
			var _this = data[counter];
			var _prev = data[counter - 1];

			if (_this.F3_Pop != null) {
				_this.F3_Pop_Current = _this.F3_Pop;
			} else {
				_this.F3_Pop_Current = _prev.F3_Pop_Current - _this.F3_Mortality;
			}
			if (_this.F4_Pop != null) {
				_this.F4_Pop_Current = _this.F4_Pop;
			} else {
				_this.F4_Pop_Current = _prev.F4_Pop_Current - _this.F4_Mortality;
			}
			if (_this.F5_Pop != null) {
				_this.F5_Pop_Current = _this.F5_Pop;
			} else {
				_this.F5_Pop_Current = _prev.F5_Pop_Current - _this.F5_Mortality;
			}

			if (_this.F3_HyLine_Weekly == null) _this.F3_HyLine_Weekly = _prev.F3_HyLine_Weekly;
			if (_this.F4_HyLine_Weekly == null) _this.F4_HyLine_Weekly = _prev.F4_HyLine_Weekly;
			if (_this.F5_HyLine_Weekly == null) _this.F5_HyLine_Weekly = _prev.F5_HyLine_Weekly;

			if (_this.F3_HyLine_Mortality == null) _this.F3_HyLine_Mortality = _prev.F3_HyLine_Mortality;
			if (_this.F4_HyLine_Mortality == null) _this.F4_HyLine_Mortality = _prev.F4_HyLine_Mortality;
			if (_this.F5_HyLine_Mortality == null) _this.F5_HyLine_Mortality = _prev.F5_HyLine_Mortality;

			_this.Total_Packaged_Production = _this.Cl800_BCE * 180 + _this.Cl800_BC * 12 + _this.Cl800_E +
				_this.Cl700_BCE * 180 + _this.Cl700_BC * 12 + _this.Cl700_BTE * 180 + _this.Cl700_TE * 30 + _this.Cl700_E +
				_this.Cl600_BCE * 180 + _this.Cl600_BC * 12 + _this.Cl600_BTE * 180 + _this.Cl600_TE * 30 + _this.Cl600_E +
				_this.ClM_BCE * 180 + _this.ClM_BC * 12 + _this.ClM_E +
				_this.ClP_BCE * 180 + _this.ClP_BC * 12 + _this.ClP_E +
				_this.Wa800_BCE * 180 + _this.Wa800_BC * 12 + _this.Wa800_E +
				_this.Wa700_BCE * 180 + _this.Wa700_BC * 12 + _this.Wa700_BTE * 180 + _this.Wa700_TE * 30 + _this.Wa700_E +
				_this.Wa600_BCE * 180 + _this.Wa600_BC * 12 + _this.Wa600_BTE * 180 + _this.Wa600_TE * 30 + _this.Wa600_E +
				_this.WaM_BCE * 180 + _this.WaM_BC * 12 + _this.WaM_E +
				_this.WaP_BCE * 180 + _this.WaP_BC * 12 + _this.WaP_E;
			_this.Total_Flock_Production = _this.F3_Collection_Clean + _this.F3_Collection_Dirty + _this.F4_Collection_Clean + _this.F4_Collection_Dirty + _this.F5_Collection_Clean + _this.F5_Collection_Dirty;
			_this.Cracked_Eggs = _this.Total_Flock_Production - _this.Total_Packaged_Production;
		}
		_full_data = datamap;
	}

	return _full_data;
}

router.get('/FlockWeeklyProduction', async function (req, res, next) {
	var data = await getFullDataWeekly2();
	var result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Collection_Clean_Sum + _d.F3_Collection_Dirty_Sum, _d.F4_Collection_Clean_Sum + _d.F4_Collection_Dirty_Sum, _d.F5_Collection_Clean_Sum + _d.F5_Collection_Dirty_Sum,]);
	}
	res.send(result);
});

router.get('/FlockWeeklyProductionPerHen', async function (req, res, next) {
	var data = await getFullDataWeekly2();
	var result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, (_d.F3_Collection_Clean_Sum + _d.F3_Collection_Dirty_Sum) / _d.F3_Pop_Current, (_d.F4_Collection_Clean_Sum + _d.F4_Collection_Dirty_Sum) / _d.F4_Pop_Current, (_d.F5_Collection_Clean_Sum + _d.F5_Collection_Dirty_Sum) / _d.F5_Pop_Current]);
	}
	res.send(result);
});

router.get('/PackedProduction', async function (req, res, next) {
	var data = await getFullDataWeekly2();
	var result = [];
	result.push(["Date", "800gm Doz Box", "800gm Doz", "800gm Egg",
		"700gm Doz Box", "700gm Doz", "700gm Tray Box", "700gm Tray", "700gm Egg",
		"600gm Doz Box", "600gm Doz", "600gm Tray Box", "600gm Tray", "600gm Egg",
		"Mega Doz Box", "Mega Doz", "Mega Egg",
		"Pullet Doz Box", "Pullet Doz", "Pullet Egg"]);
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, (_d.Cl800_BCE_Sum + _d.Wa800_BCE_Sum) * 15 * 12, (_d.Cl800_CE_Sum + _d.Wa800_CE_Sum) * 12, (_d.Cl800_E_Sum + _d.Wa800_E_Sum),
			(_d.Cl700_BCE_Sum + _d.Wa700_BCE_Sum) * 15 * 12, (_d.Cl700_CE_Sum + _d.Wa700_CE_Sum) * 12, (_d.Cl700_BCE_Sum + _d.Wa700_BTE_Sum) * 15 * 12, (_d.Cl700_TE_Sum + _d.Wa700_TE_Sum) * 12, (_d.Cl700_E_Sum + _d.Wa700_E_Sum),
			(_d.Cl600_BCE_Sum + _d.Wa600_BCE_Sum) * 15 * 12, (_d.Cl600_CE_Sum + _d.Wa600_CE_Sum) * 12, (_d.Cl600_BCE_Sum + _d.Wa600_BTE_Sum) * 15 * 12, (_d.Cl600_TE_Sum + _d.Wa600_TE_Sum) * 12, (_d.Cl600_E_Sum + _d.Wa600_E_Sum),
			(_d.ClM_BCE_Sum + _d.WaM_BCE_Sum) * 15 * 12, (_d.ClM_CE_Sum + _d.WaM_CE_Sum) * 12, (_d.ClM_E_Sum + _d.WaM_E_Sum),
			(_d.ClP_BCE_Sum + _d.WaP_BCE_Sum) * 15 * 12, (_d.ClP_CE_Sum + _d.WaP_CE_Sum) * 12, (_d.ClP_E_Sum + _d.WaP_E_Sum),
		]);
	}
	res.send(result);
});

router.get('/CrackedEggs', async function (req, res, next) {
	var data = await getFullDataWeekly2();
	var result = [];
	result.push(["Date", "Cracked eggs"]);
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, _d.Cracked_Eggs,
		]);
	}
	res.send(result);
});

router.get('/FlockMortality', async function (req, res, next) {
	var data = await getFullDataWeekly2();
	var result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		var _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Mortality_Sum, _d.F4_Mortality_Sum, _d.F5_Mortality_Sum]);
	}
	res.send(result);
});

async function getFullDataWeekly1() {
	return await db.query(`
select STRFTIME('%Y-%m-%d', CompletedAt, '-7 days', 'weekday 0') as CompletedAt, 
avg(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F3_Collection_Clean_Avg,
avg(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F4_Collection_Clean_Avg,
avg(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F5_Collection_Clean_Avg,
avg(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F3_Collection_Dirty_Avg,
avg(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F4_Collection_Dirty_Avg,
avg(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F5_Collection_Dirty_Avg,
avg(case when t.Name = 'Mortality (flock 3)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F3_Mortality_Avg,
avg(case when t.Name = 'Mortality (flock 4)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F4_Mortality_Avg,
avg(case when t.Name = 'Mortality (flock 5)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F5_Mortality_Avg,

sum(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F3_Collection_Clean_Sum,
sum(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F4_Collection_Clean_Sum,
sum(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of clean eggs' then cast(Value as numeric) else null end) as F5_Collection_Clean_Sum,
sum(case when t.Name = 'Egg collection (flock 3)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F3_Collection_Dirty_Sum,
sum(case when t.Name = 'Egg collection (flock 4)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F4_Collection_Dirty_Sum,
sum(case when t.Name = 'Egg collection (flock 5)' and tdf.Name = 'Number of dirty eggs' then cast(Value as numeric) else null end) as F5_Collection_Dirty_Sum,
sum(case when t.Name = 'Mortality (flock 3)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F3_Mortality_Sum,
sum(case when t.Name = 'Mortality (flock 4)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F4_Mortality_Sum,
sum(case when t.Name = 'Mortality (flock 5)' and tdf.Name = 'Number of dead hens today' then cast(Value as numeric) else null end) as F5_Mortality_Sum,

avg(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl800_BCE_Avg,
avg(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl800_CE_Avg,
avg(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl800_E_Avg,
avg(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa800_BCE_Avg,
avg(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa800_CE_Avg,
avg(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa800_E_Avg,

avg(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl700_BCE_Avg,
avg(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl700_CE_Avg,
avg(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl700_BTE_Avg,
avg(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl700_TE_Avg,
avg(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl700_E_Avg,

avg(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa700_BCE_Avg,
avg(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa700_CE_Avg,
avg(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa700_BTE_Avg,
avg(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa700_TE_Avg,
avg(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa700_E_Avg,

avg(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl600_BCE_Avg,
avg(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl600_CE_Avg,
avg(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl600_BTE_Avg,
avg(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl600_TE_Avg,
avg(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl600_E_Avg,

avg(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa600_BCE_Avg,
avg(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa600_CE_Avg,
avg(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa600_BTE_Avg,
avg(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa600_TE_Avg,
avg(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa600_E_Avg,

avg(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClM_BCE_Avg,
avg(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClM_CE_Avg,
avg(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClM_E_Avg,
avg(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaM_BCE_Avg,
avg(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaM_CE_Avg,
avg(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaM_E_Avg,

avg(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClP_BCE_Avg,
avg(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClP_CE_Avg,
avg(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClP_E_Avg,
avg(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaP_BCE_Avg,
avg(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaP_CE_Avg,
avg(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaP_E_Avg,

sum(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl800_BCE_Sum,
sum(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl800_CE_Sum,
sum(case when t.Name = 'Clean eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl800_E_Sum,
sum(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa800_BCE_Sum,
sum(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa800_CE_Sum,
sum(case when t.Name = 'Washed eggs 800gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa800_E_Sum,

sum(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl700_BCE_Sum,
sum(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl700_CE_Sum,
sum(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl700_BTE_Sum,
sum(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl700_TE_Sum,
sum(case when t.Name = 'Clean eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl700_E_Sum,

sum(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa700_BCE_Sum,
sum(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa700_CE_Sum,
sum(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa700_BTE_Sum,
sum(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa700_TE_Sum,
sum(case when t.Name = 'Washed eggs 700gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa700_E_Sum,

sum(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Cl600_BCE_Sum,
sum(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Cl600_CE_Sum,
sum(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Cl600_BTE_Sum,
sum(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Cl600_TE_Sum,
sum(case when t.Name = 'Clean eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Cl600_E_Sum,

sum(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as Wa600_BCE_Sum,
sum(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as Wa600_CE_Sum,
sum(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Boxes of trays (6x30 eggs)' then cast(Value as numeric) else null end) as Wa600_BTE_Sum,
sum(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Trays (30 eggs)' then cast(Value as numeric) else null end) as Wa600_TE_Sum,
sum(case when t.Name = 'Washed eggs 600gm' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as Wa600_E_Sum,

sum(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClM_BCE_Sum,
sum(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClM_CE_Sum,
sum(case when t.Name = 'Clean eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClM_E_Sum,
sum(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaM_BCE_Sum,
sum(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaM_CE_Sum,
sum(case when t.Name = 'Washed eggs (mega)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaM_E_Sum,

sum(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as ClP_BCE_Sum,
sum(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as ClP_CE_Sum,
sum(case when t.Name = 'Clean eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as ClP_E_Sum,
sum(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Boxes of cartons (15x12 eggs)' then cast(Value as numeric) else null end) as WaP_BCE_Sum,
sum(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Cartons (12 eggs)' then cast(Value as numeric) else null end) as WaP_CE_Sum,
sum(case when t.Name = 'Washed eggs (pullets)' and tdf.Name = 'Eggs' then cast(Value as numeric) else null end) as WaP_E_Sum

from Tasks t, Registrations r
inner join TaskCompletions tc on t.id = tc.TaskId and tc.RegistrationId = r.id
inner join TaskDataFields tdf on t.id = tdf.TaskId
inner join TaskData td on tdf.id = td.TaskDataFieldId and td.TaskCompletionId = tc.id
group by STRFTIME('%Y-%m-%d', CompletedAt, '-7 days', 'weekday 1')
order by STRFTIME('%Y-%m-%d', CompletedAt, '-7 days', 'weekday 1')
	`);
}

var _full_data_weekly;

async function getFullDataWeekly2(regen) {
	if (_full_data_weekly == null || regen) {
		var data = await getFullDataWeekly1(), datamap = {};
		data = data[0];
		data.forEach(d => {
			datamap[d.CompletedAt] = d;
		});

		var datadaily = await getFullData2();
		data.forEach(d => {
			var week = Object.keys(datadaily).filter(k => moment(k) >= moment(d.CompletedAt) && moment(k) < moment(d.CompletedAt).add(7, 'days'));
			week._sum3 = 0;
			week._count3 = 0;
			week._sum4 = 0;
			week._count4 = 0;
			week._sum5 = 0;
			week._count5 = 0;
			week.forEach(currentValue => {
				if (datadaily[currentValue].F3_Pop_Current != null) {
					week._sum3 += datadaily[currentValue].F3_Pop_Current;
					week._count3++;
				}
				if (datadaily[currentValue].F4_Pop_Current != null) {
					week._sum4 += datadaily[currentValue].F4_Pop_Current;
					week._count4++;
				}
				if (datadaily[currentValue].F5_Pop_Current != null) {
					week._sum5 += datadaily[currentValue].F5_Pop_Current;
					week._count5++;
				}
			});
			d.F3_Pop_Current = week._sum3 / week._count3;
			d.F4_Pop_Current = week._sum4 / week._count4;
			d.F5_Pop_Current = week._sum5 / week._count5;

			d.Total_Packaged_Production = [d.Cl800_BCE_Sum * 180, d.Cl800_BC_Sum * 12, d.Cl800_E_Sum,
				d.Cl700_BCE_Sum * 180, d.Cl700_BC_Sum * 12, d.Cl700_BTE_Sum * 180, d.Cl700_TE_Sum * 30, d.Cl700_E_Sum,
				d.Cl600_BCE_Sum * 180, d.Cl600_BC_Sum * 12, d.Cl600_BTE_Sum * 180, d.Cl600_TE_Sum * 30, d.Cl600_E_Sum,
				d.ClM_BCE_Sum * 180, d.ClM_BC_Sum * 12, d.ClM_E_Sum,
				d.ClP_BCE_Sum * 180, d.ClP_BC_Sum * 12, d.ClP_E_Sum,
				d.Wa800_BCE_Sum * 180, d.Wa800_BC_Sum * 12, d.Wa800_E_Sum,
				d.Wa700_BCE_Sum * 180, d.Wa700_BC_Sum * 12, d.Wa700_BTE_Sum * 180, d.Wa700_TE_Sum * 30, d.Wa700_E_Sum,
				d.Wa600_BCE_Sum * 180, d.Wa600_BC_Sum * 12, d.Wa600_BTE_Sum * 180, d.Wa600_TE_Sum * 30, d.Wa600_E_Sum,
				d.WaM_BCE_Sum * 180, d.WaM_BC_Sum * 12, d.WaM_E_Sum,
				d.WaP_BCE_Sum * 180, d.WaP_BC_Sum * 12, d.WaP_E_Sum].reduce((previousValue, currentValue, currentIndex, array) => {
				var result = 0;
				if (!isNaN(previousValue)) result = previousValue;
				if (!isNaN(currentValue)) result += currentValue;
				return result;
			});

			d.Total_Flock_Production = [d.F3_Collection_Clean_Sum, d.F3_Collection_Dirty_Sum
				, d.F4_Collection_Clean_Sum, d.F4_Collection_Dirty_Sum
				, d.F5_Collection_Clean_Sum, d.F5_Collection_Dirty_Sum].reduce((previousValue, currentValue, currentIndex, array) => {
				var result = 0;
				if (!isNaN(previousValue)) result = previousValue;
				if (!isNaN(currentValue)) result += currentValue;
				return result;
			});
			d.Cracked_Eggs = d.Total_Packaged_Production == 0 ? 0 : d.Total_Flock_Production - d.Total_Packaged_Production;
		});

		_full_data_weekly = datamap;
	}

	return _full_data_weekly;
}

async function census(flock_id) {
	return await db.query(`
select CompletedAt, strftime('%Y%m%d', CompletedAt) as DateComp, sum(Value) as Value
from
(select TimeIn, CompletedAt, -1*cast(td.Value as integer) as Value
from Tasks t, Registrations r
inner join TaskCompletions tc on t.id = tc.TaskId and tc.RegistrationId = r.id
inner join TaskDataFields tdf on t.id = tdf.TaskId
inner join TaskData td on tdf.id = td.TaskDataFieldId and td.TaskCompletionId = tc.id
where t.Name = :mtname

union all

select TimeIn, CompletedAt, cast(case when Value is null then 0 else Value end as integer) as Value
from Tasks t, Registrations r
left join TaskCompletions tc on t.id = tc.TaskId and tc.RegistrationId = r.id
left join TaskDataFields tdf on t.id = tdf.TaskId
left join TaskData td on tdf.id = td.TaskDataFieldId and td.TaskCompletionId = tc.id
where t.Name = :tname
)
where CompletedAt not null
group by CompletedAt
order by TimeIn
	`, {
		replacements: {
			tname: "Hen population (flock " + flock_id + ")",
			mtname: "Mortality (flock " + flock_id + ")"
		}
	});
}

async function dailyFlockProduction(flock_id) {
	return await db.query(`
SELECT 
	t.Name as TaskName, 
	'Total production (clean + dirty eggs)' as TaskDataFieldName, 
	sum(cast(td.Value as NUMERIC)) as TaskDataValue,
	tc.CompletedAt as CompletedAt,
	strftime('%Y%m%d', tc.CompletedAt) as TaskCompletionCompletedAt
FROM Tasks t 
inner join TaskDataFields tdf on t.id = tdf.TaskId
inner join TaskCompletions tc on tc.TaskId = t.id
inner join TaskData td on tdf.id = td.TaskDataFieldId and tc.id = td.TaskCompletionId
where t.Name = :tname
	and (tdf.Name = 'Number of clean eggs' or tdf.Name = 'Number of dirty eggs')
	and tdf.DataType = 'NUMBER'
group by t.Name, strftime('%Y%m%d', tc.CompletedAt)
order by strftime('%Y%m%d', tc.CompletedAt)
	`, {
		replacements: {
			tname: "Egg collection (flock " + flock_id + ")",
		}
	});
}

async function hyline(flock_id) {
	var x = getFullData2();
}

router.get('/ProductionPerHen/:flock_id', async function (req, res, next) {
	var x = getFullData2();
	var flock_id = req.params.flock_id;

	var c = await census(flock_id), cmap = {};
	c = c[0];
	c.forEach(function (v) {
		cmap[v.DateComp] = v
	});

	for (counter = 1; counter < c.length; counter++) {
		if (c[counter]["Value"] <= 0) {
			c[counter]["Value"] = c[counter - 1]["Value"] + c[counter]["Value"];
		}
	}

	var p = await dailyFlockProduction(flock_id), pmap = {};
	p = p[0];
	p.forEach(function (v) {
		pmap[v.TaskCompletionCompletedAt] = v
	});

	var result = {};
	var series = [];
	var data = [];
	result.series = series;
	for (let _d in pmap) {
		var _date = pmap[_d]["CompletedAt"];
		var _prod = pmap[_d]["TaskDataValue"];
		var _pop = cmap[_d]["Value"];
		data.push({x: new Date(_date).getTime(), y: _prod / _pop});
	}
	series.push({name: "Flock " + flock_id, data: data});
	res.send(result);
});

const DATE = 0;
const F1_CLEAN_EGGS = 1;
const F2_CLEAN_EGGS = 2;
const F3_CLEAN_EGGS = 3;
const F1_DIRTY_EGGS = 4;
const F2_DIRTY_EGGS = 5;
const F3_DIRTY_EGGS = 6;
const F1_DEAD_HENS = 7;
const F2_DEAD_HENS = 8;
const F3_DEAD_HENS = 9;
const F1_M_HYLINE = 10;
const F2_M_HYLINE = 11;
const F3_M_HYLINE = 12;
const F1_POP = 13;
const F2_POP = 14;
const F3_POP = 15;
const F1_P_HYLINE = 16;
const F2_P_HYLINE = 17;
const F3_P_HYLINE = 18;

const CL_B_800 = 19;
const CL_C_800 = 20;
const CL_E_800 = 21;

const CL_D_B_700 = 22;
const CL_D_C_700 = 23;
const CL_D_E_700 = 24;
const CL_T_B_700 = 25;
const CL_T_T_700 = 26;
const CL_T_E_700 = 27;

const CL_D_B_600 = 28;
const CL_D_C_600 = 29;
const CL_D_E_600 = 30;
const CL_T_B_600 = 31;
const CL_T_T_600 = 32;
const CL_T_E_600 = 33;

const CL_T_B_M = 34;
const CL_T_T_M = 35;
const CL_T_E_M = 36;
const CL_T_B_P = 37;
const CL_T_T_P = 38;
const CL_T_E_P = 39;

const WA_B_800 = 40;
const WA_C_800 = 41;
const WA_E_800 = 42;

const WA_D_B_700 = 43;
const WA_D_C_700 = 44;
const WA_D_E_700 = 45;
const WA_T_B_700 = 46;
const WA_T_T_700 = 47;
const WA_T_E_700 = 48;

const WA_D_B_600 = 49;
const WA_D_C_600 = 50;
const WA_D_E_600 = 51;
const WA_T_B_600 = 52;
const WA_T_T_600 = 53;
const WA_T_E_600 = 54;

const WA_T_B_M = 55;
const WA_T_T_M = 56;
const WA_T_E_M = 57;
const WA_T_B_P = 58;
const WA_T_T_P = 59;
const WA_T_E_P = 60;

const F3_CL_D_B_800 = 61;
const F3_CL_D_C_800 = 62;
const F3_CL_D_E_800 = 63;
const F3_CL_T_B_800 = 64;
const F3_CL_T_T_800 = 65;
const F3_CL_T_E_800 = 66;

const F3_CL_D_B_700 = 67;
const F3_CL_D_C_700 = 68;
const F3_CL_D_E_700 = 69;
const F3_CL_T_B_700 = 70;
const F3_CL_T_T_700 = 71;
const F3_CL_T_E_700 = 72;

const F3_CL_D_B_600 = 73;
const F3_CL_D_C_600 = 74;
const F3_CL_D_E_600 = 75;
const F3_CL_T_B_600 = 76;
const F3_CL_T_T_600 = 77;
const F3_CL_T_E_600 = 78;

const F3_CL_D_B_M = 79;
const F3_CL_D_C_M = 80;
const F3_CL_D_E_M = 81;
const F3_CL_T_B_M = 82;
const F3_CL_T_T_M = 83;
const F3_CL_T_E_M = 84;

//const F3_CL_T_B_P = 85;
//const F3_CL_T_T_P = 86;
//const F3_CL_T_E_P = 87;
//const F3_CL_T_B_P = 88;
//const F3_CL_T_T_P = 89;
//const F3_CL_T_E_P = 90;


router.get('/GenerateTestData', function (req, res, next) {
	var fs = require("fs"), path = require("path"), util = require("util");

	var content, data = {};

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "egg_collection_f1.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		var line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F1_CLEAN_EGGS] = parseInt(line[1]);
		if (line[2] != "") d[F1_DIRTY_EGGS] = parseInt(line[2]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "egg_collection_f2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F2_CLEAN_EGGS] = parseInt(line[1]);
		if (line[2] != "") d[F2_DIRTY_EGGS] = parseInt(line[2]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "egg_collection_f3.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F3_CLEAN_EGGS] = parseInt(line[1]);
		if (line[2] != "") d[F3_DIRTY_EGGS] = parseInt(line[2]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "mortality_f1f2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F1_DEAD_HENS] = parseInt(line[1]);
		if (line[2] != "") d[F2_DEAD_HENS] = parseInt(line[2]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "mortality_f3.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F3_DEAD_HENS] = parseInt(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "m_hy_f1f2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F1_M_HYLINE] = parseFloat(line[1]);
		if (line[1] != "") d[F2_M_HYLINE] = parseFloat(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "m_hy_f3.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F3_M_HYLINE] = parseFloat(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "pop_f1f2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F1_POP] = parseInt(line[1]);
		if (line[2] != "") d[F2_POP] = parseInt(line[2]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "pop_f3.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F3_POP] = parseInt(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "production_hyline_f1f2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F1_P_HYLINE] = parseFloat(line[1]);
		if (line[1] != "") d[F2_P_HYLINE] = parseFloat(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "production_hyline_f3.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];
		if (line[1] != "") d[F3_P_HYLINE] = parseFloat(line[1]);
	}

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "packaged_production.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];

		if (line[1] != "") d[CL_B_800] = parseInt(line[1]);
		if (line[2] != "") d[CL_C_800] = parseInt(line[2]);
		if (line[3] != "") d[CL_E_800] = parseInt(line[3]);
		if (line[4] != "") d[CL_D_B_700] = parseInt(line[4]);
		if (line[5] != "") d[CL_D_C_700] = parseInt(line[5]);
		if (line[6] != "") d[CL_D_E_700] = parseInt(line[6]);
		if (line[7] != "") d[CL_T_B_700] = parseInt(line[7]);
		if (line[8] != "") d[CL_T_T_700] = parseInt(line[8]);
		if (line[9] != "") d[CL_T_E_700] = parseInt(line[9]);
		if (line[10] != "") d[CL_D_B_600] = parseInt(line[10]);
		if (line[11] != "") d[CL_D_C_600] = parseInt(line[11]);
		if (line[12] != "") d[CL_D_E_600] = parseInt(line[12]);
		if (line[13] != "") d[CL_T_B_600] = parseInt(line[13]);
		if (line[14] != "") d[CL_T_T_600] = parseInt(line[14]);
		if (line[15] != "") d[CL_T_E_600] = parseInt(line[15]);
		if (line[16] != "") d[CL_T_B_M] = parseInt(line[16]);
		if (line[17] != "") d[CL_T_T_M] = parseInt(line[17]);
		if (line[18] != "") d[CL_T_E_M] = parseInt(line[18]);
		if (line[19] != "") d[CL_T_B_P] = parseInt(line[19]);
		if (line[20] != "") d[CL_T_T_P] = parseInt(line[20]);
		if (line[21] != "") d[CL_T_E_P] = parseInt(line[21]);

		if (line[22] != "") d[WA_B_800] = parseInt(line[22]);
		if (line[23] != "") d[WA_C_800] = parseInt(line[23]);
		if (line[24] != "") d[WA_E_800] = parseInt(line[24]);
		if (line[25] != "") d[WA_D_B_700] = parseInt(line[25]);
		if (line[26] != "") d[WA_D_C_700] = parseInt(line[26]);
		if (line[27] != "") d[WA_D_E_700] = parseInt(line[27]);
		if (line[28] != "") d[WA_T_B_700] = parseInt(line[28]);
		if (line[29] != "") d[WA_T_T_700] = parseInt(line[29]);
		if (line[30] != "") d[WA_T_E_700] = parseInt(line[30]);
		if (line[31] != "") d[WA_D_B_600] = parseInt(line[31]);
		if (line[32] != "") d[WA_D_C_600] = parseInt(line[32]);
		if (line[33] != "") d[WA_D_E_600] = parseInt(line[33]);
		if (line[34] != "") d[WA_T_B_600] = parseInt(line[34]);
		if (line[35] != "") d[WA_T_T_600] = parseInt(line[35]);
		if (line[36] != "") d[WA_T_E_600] = parseInt(line[36]);
		if (line[37] != "") d[WA_T_B_M] = parseInt(line[37]);
		if (line[38] != "") d[WA_T_T_M] = parseInt(line[38]);
		if (line[39] != "") d[WA_T_E_M] = parseInt(line[39]);
		if (line[40] != "") d[WA_T_B_P] = parseInt(line[40]);
		if (line[41] != "") d[WA_T_T_P] = parseInt(line[41]);
		if (line[42] != "") d[WA_T_E_P] = parseInt(line[42]);
	}

	Person.create({
		ID: 1234,
		Name: "Importer",
		Passcode: 1234,
		Active: true,
		Admin: true
	}).then(p => {
		//console.log(p);
		let promises = [];

		for (d in data) {
			promises.push(importDay(p, data[d]));
		}

		return Promise.all(promises);
	}).then(function () {
		res.send("ok");
	}).catch(function (e) {
		console.log(e);
	});
});


module.exports = router;


var importDay = function (p, dv) {
	var cdate = new moment(dv[DATE], 'DD/MM/YYYY').tz('Australia/Sydney').startOf('day');
	console.log(cdate);
	if (cdate == null) return null;
	return Registration.create({
		TimeIn: new moment(cdate).add(8, 'hour'),
		TimeOut: new moment(cdate).add(18, 'hour'),
		PersonID: p.ID
	}).then(r => {
		//console.log(r);

		if (dv[F1_CLEAN_EGGS] != null || dv[F1_DIRTY_EGGS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 2,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F1_CLEAN_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F1_CLEAN_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 32
				}));

				if (dv[F1_DIRTY_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F1_DIRTY_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 33
				}));
				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F2_CLEAN_EGGS] != null || dv[F2_DIRTY_EGGS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 3,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F2_CLEAN_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F2_CLEAN_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 34
				}));

				if (dv[F2_DIRTY_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F2_DIRTY_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 35
				}));
				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F3_CLEAN_EGGS] != null || dv[F3_DIRTY_EGGS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 4,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F3_CLEAN_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F3_CLEAN_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 36
				}));

				if (dv[F3_DIRTY_EGGS] != null) _p.push(TaskData.create({
					Value: dv[F3_DIRTY_EGGS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 37
				}));
				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F1_DEAD_HENS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 33,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F1_DEAD_HENS] != null) _p.push(TaskData.create({
					Value: dv[F1_DEAD_HENS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 29
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F2_DEAD_HENS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 34,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F2_DEAD_HENS] != null) _p.push(TaskData.create({
					Value: dv[F2_DEAD_HENS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 30
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F3_DEAD_HENS] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 35,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F3_DEAD_HENS] != null) _p.push(TaskData.create({
					Value: dv[F3_DEAD_HENS],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 31
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F1_POP] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 36,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F1_POP] != null) _p.push(TaskData.create({
					Value: dv[F1_POP],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 39
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F2_POP] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 37,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F2_POP] != null) _p.push(TaskData.create({
					Value: dv[F2_POP],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 41
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F3_POP] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 38,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F3_POP] != null) _p.push(TaskData.create({
					Value: dv[F3_POP],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 40
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F1_P_HYLINE] != null || dv[F1_M_HYLINE] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 39,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F1_P_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F1_P_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 42
				}));

				if (dv[F1_M_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F1_M_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 43
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F2_P_HYLINE] != null || dv[F2_M_HYLINE] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 40,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F2_P_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F2_P_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 44
				}));

				if (dv[F2_M_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F2_M_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 45
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[F3_P_HYLINE] != null || dv[F3_M_HYLINE] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 41,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[F3_P_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F3_P_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 46
				}));

				if (dv[F3_M_HYLINE] != null) _p.push(TaskData.create({
					Value: dv[F3_M_HYLINE],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 47
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[CL_B_800] != null || dv[CL_C_800] != null || dv[CL_E_800] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 42,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[CL_B_800] != null) _p.push(TaskData.create({
					Value: dv[CL_B_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 48
				}));

				if (dv[CL_C_800] != null) _p.push(TaskData.create({
					Value: dv[CL_C_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 49
				}));

				if (dv[CL_E_800] != null) _p.push(TaskData.create({
					Value: dv[CL_E_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 50
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[WA_B_800] != null || dv[WA_C_800] != null || dv[WA_E_800] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 43,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[WA_B_800] != null) _p.push(TaskData.create({
					Value: dv[WA_B_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 51
				}));

				if (dv[WA_C_800] != null) _p.push(TaskData.create({
					Value: dv[WA_C_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 52
				}));

				if (dv[WA_E_800] != null) _p.push(TaskData.create({
					Value: dv[WA_E_800],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 53
				}));

			});

		if (dv[CL_T_B_P] != null || dv[CL_T_T_P] != null || dv[CL_T_E_P] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 49,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[CL_T_B_P] != null) _p.push(TaskData.create({
					Value: dv[CL_T_B_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 77
				}));

				if (dv[CL_T_T_P] != null) _p.push(TaskData.create({
					Value: dv[CL_T_T_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 78
				}));

				if (dv[CL_T_E_P] != null) _p.push(TaskData.create({
					Value: dv[CL_T_E_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 79
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[WA_T_B_P] != null || dv[WA_T_T_P] != null || dv[WA_T_E_P] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 51,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[WA_T_B_P] != null) _p.push(TaskData.create({
					Value: dv[WA_T_B_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 83
				}));

				if (dv[WA_T_T_P] != null) _p.push(TaskData.create({
					Value: dv[WA_T_T_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 84
				}));

				if (dv[WA_T_E_P] != null) _p.push(TaskData.create({
					Value: dv[WA_T_E_P],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 85
				}));

			});

		if (dv[CL_T_B_M] != null || dv[CL_T_T_M] != null || dv[CL_T_E_M] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 48,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[CL_T_B_M] != null) _p.push(TaskData.create({
					Value: dv[CL_T_B_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 74
				}));

				if (dv[CL_T_T_M] != null) _p.push(TaskData.create({
					Value: dv[CL_T_T_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 75
				}));

				if (dv[CL_T_E_M] != null) _p.push(TaskData.create({
					Value: dv[CL_T_E_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 76
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[WA_T_B_M] != null || dv[WA_T_T_M] != null || dv[WA_T_E_M] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 50,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[WA_T_B_M] != null) _p.push(TaskData.create({
					Value: dv[WA_T_B_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 80
				}));

				if (dv[WA_T_T_M] != null) _p.push(TaskData.create({
					Value: dv[WA_T_T_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 81
				}));

				if (dv[WA_T_E_M] != null) _p.push(TaskData.create({
					Value: dv[WA_T_E_M],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 82
				}));

			});

		if (dv[CL_D_B_700] != null || dv[CL_D_C_700] != null || dv[CL_D_E_700] != null || dv[CL_T_B_700] != null || dv[CL_T_T_700] != null || dv[CL_T_E_700] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 44,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[CL_D_B_700] != null) _p.push(TaskData.create({
					Value: dv[CL_D_B_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 54
				}));

				if (dv[CL_D_C_700] != null) _p.push(TaskData.create({
					Value: dv[CL_D_C_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 55
				}));

				if (dv[CL_D_E_700] != null || dv[CL_T_E_700 != null]) _p.push(TaskData.create({
					Value: (dv[CL_D_E_700] == null ? 0 : dv[CL_D_E_700]) + (dv[CL_T_E_700] == null ? 0 : dv[CL_T_E_700]),
					TaskCompletionId: tc.id,
					TaskDataFieldId: 56
				}));

				if (dv[CL_T_B_700] != null) _p.push(TaskData.create({
					Value: dv[CL_T_B_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 57
				}));

				if (dv[CL_T_T_700] != null) _p.push(TaskData.create({
					Value: dv[CL_T_T_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 58
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[WA_D_B_700] != null || dv[WA_D_C_700] != null || dv[WA_D_E_700] != null || dv[WA_T_B_700] != null || dv[WA_T_T_700] != null || dv[WA_T_E_700] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 45,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[WA_D_B_700] != null) _p.push(TaskData.create({
					Value: dv[WA_D_B_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 59
				}));

				if (dv[WA_D_C_700] != null) _p.push(TaskData.create({
					Value: dv[WA_D_C_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 60
				}));

				if (dv[WA_D_E_700] != null || dv[WA_T_E_700 != null]) _p.push(TaskData.create({
					Value: (dv[WA_D_E_700] == null ? 0 : dv[WA_D_E_700]) + (dv[WA_T_E_700] == null ? 0 : dv[WA_T_E_700]),
					TaskCompletionId: tc.id,
					TaskDataFieldId: 61
				}));

				if (dv[WA_T_B_700] != null) _p.push(TaskData.create({
					Value: dv[WA_T_B_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 62
				}));

				if (dv[WA_T_T_700] != null) _p.push(TaskData.create({
					Value: dv[WA_T_T_700],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 63
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[CL_D_B_600] != null || dv[CL_D_C_600] != null || dv[CL_D_E_600] != null || dv[CL_T_B_600] != null || dv[CL_T_T_600] != null || dv[CL_T_E_600] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 46,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[CL_D_B_600] != null) _p.push(TaskData.create({
					Value: dv[CL_D_B_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 64
				}));

				if (dv[CL_D_C_600] != null) _p.push(TaskData.create({
					Value: dv[CL_D_C_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 65
				}));

				if (dv[CL_D_E_600] != null || dv[CL_T_E_600 != null]) _p.push(TaskData.create({
					Value: (dv[CL_D_E_600] == null ? 0 : dv[CL_D_E_600]) + (dv[CL_T_E_600] == null ? 0 : dv[CL_T_E_600]),
					TaskCompletionId: tc.id,
					TaskDataFieldId: 66
				}));

				if (dv[CL_T_B_600] != null) _p.push(TaskData.create({
					Value: dv[CL_T_B_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 67
				}));

				if (dv[CL_T_T_600] != null) _p.push(TaskData.create({
					Value: dv[CL_T_T_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 68
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

		if (dv[WA_D_B_600] != null || dv[WA_D_C_600] != null || dv[WA_D_E_600] != null || dv[WA_T_B_600] != null || dv[WA_T_T_600] != null || dv[WA_T_E_600] != null)
			TaskCompletion.create({
				CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
				TaskId: 47,
				RegistrationId: r.id
			}).then(tc => {
				var _p = [];
				if (dv[WA_D_B_600] != null) _p.push(TaskData.create({
					Value: dv[WA_D_B_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 69
				}));

				if (dv[WA_D_C_600] != null) _p.push(TaskData.create({
					Value: dv[WA_D_C_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 70
				}));

				if (dv[WA_D_E_600] != null || dv[WA_T_E_600 != null]) _p.push(TaskData.create({
					Value: (dv[WA_D_E_600] == null ? 0 : dv[WA_D_E_600]) + (dv[WA_T_E_600] == null ? 0 : dv[WA_T_E_600]),
					TaskCompletionId: tc.id,
					TaskDataFieldId: 71
				}));

				if (dv[WA_T_B_600] != null) _p.push(TaskData.create({
					Value: dv[WA_T_B_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 72
				}));

				if (dv[WA_T_T_600] != null) _p.push(TaskData.create({
					Value: dv[WA_T_T_600],
					TaskCompletionId: tc.id,
					TaskDataFieldId: 73
				}));

				//console.log(tc);
				return Promise.all(_p);
			});

	}).error(e => {
		console.log(e);
	});
};