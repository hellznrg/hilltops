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
	let data = await getFullData2();
	let result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Collection_Clean + _d.F3_Collection_Dirty, _d.F4_Collection_Clean + _d.F4_Collection_Dirty, _d.F5_Collection_Clean + _d.F5_Collection_Dirty,]);
	}
	res.send(result);
});

router.get('/FlockDailyProductionPerHen', async function (req, res, next) {
	let data = await getFullData2();
	let result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, (_d.F3_Collection_Clean + _d.F3_Collection_Dirty) / _d.F3_Pop_Current, (_d.F4_Collection_Clean + _d.F4_Collection_Dirty) / _d.F4_Pop_Current, (_d.F5_Collection_Clean + _d.F5_Collection_Dirty) / _d.F5_Pop_Current]);
	}
	res.send(result);
});

async function getFullData1() {
	return await db.query(`
select * from "Daily";
	`);
}

var _full_data;

async function getFullData2(regen) {
	if (_full_data == null || regen) {
		let data = await getFullData1(), datamap = {};
		data = data[0];
		data.forEach(d => {
			datamap[d.CompletedAt] = d;
		});
		if (data[0]["F3_Pop"] != 0) data[0]["F3_Pop_Current"] = data[0]["F3_Pop"]; else data[0]["F3_Pop_Current"] = 0;
		if (data[0]["F4_Pop"] != 0) data[0]["F4_Pop_Current"] = data[0]["F4_Pop"]; else data[0]["F4_Pop_Current"] = 0;
		if (data[0]["F5_Pop"] != 0) data[0]["F5_Pop_Current"] = data[0]["F5_Pop"]; else data[0]["F5_Pop_Current"] = 0;

		for (counter = 1; counter < data.length; counter++) {
			let _this = data[counter];
			let _prev = data[counter - 1];

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
	let data = await getFullDataWeekly2();
	let result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Collection_Clean_Sum + _d.F3_Collection_Dirty_Sum, _d.F4_Collection_Clean_Sum + _d.F4_Collection_Dirty_Sum, _d.F5_Collection_Clean_Sum + _d.F5_Collection_Dirty_Sum,]);
	}
	res.send(result);
});

router.get('/FlockWeeklyProductionPerHen', async function (req, res, next) {
	let data = await getFullDataWeekly2();
	let result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, (_d.F3_Collection_Clean_Sum + _d.F3_Collection_Dirty_Sum) / _d.F3_Pop_Current, (_d.F4_Collection_Clean_Sum + _d.F4_Collection_Dirty_Sum) / _d.F4_Pop_Current, (_d.F5_Collection_Clean_Sum + _d.F5_Collection_Dirty_Sum) / _d.F5_Pop_Current]);
	}
	res.send(result);
});

router.get('/PackedProduction', async function (req, res, next) {
	return db.query(`
	select * from "PackedProduction_Weekly";
	`).then(data => {
		let result = [];
		result.push(["Date", "800gm Doz Box", "800gm Doz", "800gm Egg",
			"700gm Doz Box", "700gm Doz", "700gm Tray Box", "700gm Tray", "700gm Egg",
			"600gm Doz Box", "600gm Doz", "600gm Tray Box", "600gm Tray", "600gm Egg",
			"Mega Doz Box", "Mega Doz", "Mega Egg",
			"Pullet Doz Box", "Pullet Doz", "Pullet Egg"]);
		for (let row of data[0]) {
			result.push(Object.values(row));
		}
		res.send(result);
	});

	// let data = await getFullDataWeekly2();
	// let result = [];
	// result.push(["Date", "800gm Doz Box", "800gm Doz", "800gm Egg",
	// 	"700gm Doz Box", "700gm Doz", "700gm Tray Box", "700gm Tray", "700gm Egg",
	// 	"600gm Doz Box", "600gm Doz", "600gm Tray Box", "600gm Tray", "600gm Egg",
	// 	"Mega Doz Box", "Mega Doz", "Mega Egg",
	// 	"Pullet Doz Box", "Pullet Doz", "Pullet Egg"]);
	// for (_dx in data) {
	// 	let _d = data[_dx];
	// 	result.push([_d.CompletedAt, (_d.Cl800_BCE_Sum + _d.Wa800_BCE_Sum) * 15 * 12, (_d.Cl800_CE_Sum + _d.Wa800_CE_Sum) * 12, (_d.Cl800_E_Sum + _d.Wa800_E_Sum),
	// 		(_d.Cl700_BCE_Sum + _d.Wa700_BCE_Sum) * 15 * 12, (_d.Cl700_CE_Sum + _d.Wa700_CE_Sum) * 12, (_d.Cl700_BCE_Sum + _d.Wa700_BTE_Sum) * 15 * 12, (_d.Cl700_TE_Sum + _d.Wa700_TE_Sum) * 12, (_d.Cl700_E_Sum + _d.Wa700_E_Sum),
	// 		(_d.Cl600_BCE_Sum + _d.Wa600_BCE_Sum) * 15 * 12, (_d.Cl600_CE_Sum + _d.Wa600_CE_Sum) * 12, (_d.Cl600_BCE_Sum + _d.Wa600_BTE_Sum) * 15 * 12, (_d.Cl600_TE_Sum + _d.Wa600_TE_Sum) * 12, (_d.Cl600_E_Sum + _d.Wa600_E_Sum),
	// 		(_d.ClM_BCE_Sum + _d.WaM_BCE_Sum) * 15 * 12, (_d.ClM_CE_Sum + _d.WaM_CE_Sum) * 12, (_d.ClM_E_Sum + _d.WaM_E_Sum),
	// 		(_d.ClP_BCE_Sum + _d.WaP_BCE_Sum) * 15 * 12, (_d.ClP_CE_Sum + _d.WaP_CE_Sum) * 12, (_d.ClP_E_Sum + _d.WaP_E_Sum),
	// 	]);
	// }
	// res.send(result);
});

router.get('/CrackedEggs', async function (req, res, next) {
	let data = await getFullDataWeekly2();
	let result = [];
	result.push(["Date", "Cracked eggs"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, _d.Cracked_Eggs,
		]);
	}
	res.send(result);
});

router.get('/FlockMortality', async function (req, res, next) {
	let data = await getFullDataWeekly2();
	let result = [];
	result.push(["Date", "Flock 3", "Flock 4", "Flock 5"]);
	for (_dx in data) {
		let _d = data[_dx];
		result.push([_d.CompletedAt, _d.F3_Mortality_Sum, _d.F4_Mortality_Sum, _d.F5_Mortality_Sum]);
	}
	res.send(result);
});

async function getFullDataWeekly1() {
	return await db.query(`
	select * from "Weekly";
	`);
}

var _full_data_weekly;

async function getFullDataWeekly2(regen) {
	if (_full_data_weekly == null || regen) {
		let data = await getFullDataWeekly1(), datamap = {};
		data = data[0];
		data.forEach(d => {
			datamap[d.CompletedAt] = d;
		});

		let datadaily = await getFullData2();
		data.forEach(d => {
			let week = Object.keys(datadaily).filter(k => moment(k) >= moment(d.CompletedAt) && moment(k) < moment(d.CompletedAt).add(7, 'days'));
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
				let result = 0;
				if (!isNaN(previousValue)) result = previousValue;
				if (!isNaN(currentValue)) result += currentValue;
				return result;
			});

			d.Total_Flock_Production = [d.F3_Collection_Clean_Sum, d.F3_Collection_Dirty_Sum
				, d.F4_Collection_Clean_Sum, d.F4_Collection_Dirty_Sum
				, d.F5_Collection_Clean_Sum, d.F5_Collection_Dirty_Sum].reduce((previousValue, currentValue, currentIndex, array) => {
				let result = 0;
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
	let x = getFullData2();
}

router.get('/ProductionPerHen/:flock_id', async function (req, res, next) {
	let x = getFullData2();
	let flock_id = req.params.flock_id;

	let c = await census(flock_id), cmap = {};
	c = c[0];
	c.forEach(function (v) {
		cmap[v.DateComp] = v
	});

	for (counter = 1; counter < c.length; counter++) {
		if (c[counter]["Value"] <= 0) {
			c[counter]["Value"] = c[counter - 1]["Value"] + c[counter]["Value"];
		}
	}

	let p = await dailyFlockProduction(flock_id), pmap = {};
	p = p[0];
	p.forEach(function (v) {
		pmap[v.TaskCompletionCompletedAt] = v
	});

	let result = {};
	let series = [];
	let data = [];
	result.series = series;
	for (let _d in pmap) {
		let _date = pmap[_d]["CompletedAt"];
		let _prod = pmap[_d]["TaskDataValue"];
		let _pop = cmap[_d]["Value"];
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
const F4_CL_D_B_800 = 64;
const F4_CL_D_C_800 = 65;
const F4_CL_D_E_800 = 66;
const F5_CL_D_B_800 = 67;
const F5_CL_D_C_800 = 68;
const F5_CL_D_E_800 = 69;

const F3_CL_D_B_700 = 70;
const F3_CL_D_C_700 = 71;
const F3_CL_D_E_700 = 72;
const F4_CL_D_B_700 = 73;
const F4_CL_D_C_700 = 74;
const F4_CL_D_E_700 = 75;
const F5_CL_D_B_700 = 76;
const F5_CL_D_C_700 = 77;
const F5_CL_D_E_700 = 78;

const F3_CL_T_B_700 = 79;
const F3_CL_T_T_700 = 80;
const F3_CL_T_E_700 = 81;
const F4_CL_T_B_700 = 82;
const F4_CL_T_T_700 = 83;
const F4_CL_T_E_700 = 84;
const F5_CL_T_B_700 = 85;
const F5_CL_T_T_700 = 86;
const F5_CL_T_E_700 = 87;

const F3_CL_D_B_600 = 88;
const F3_CL_D_C_600 = 89;
const F3_CL_D_E_600 = 90;
const F4_CL_D_B_600 = 91;
const F4_CL_D_C_600 = 92;
const F4_CL_D_E_600 = 93;
const F5_CL_D_B_600 = 94;
const F5_CL_D_C_600 = 95;
const F5_CL_D_E_600 = 96;

const F3_CL_T_B_600 = 97;
const F3_CL_T_T_600 = 98;
const F3_CL_T_E_600 = 99;
const F4_CL_T_B_600 = 100;
const F4_CL_T_T_600 = 101;
const F4_CL_T_E_600 = 102;
const F5_CL_T_B_600 = 103;
const F5_CL_T_T_600 = 104;
const F5_CL_T_E_600 = 105;

const F3_CL_T_B_M = 106;
const F3_CL_T_T_M = 107;
const F3_CL_T_E_M = 108;
const F4_CL_T_B_M = 109;
const F4_CL_T_T_M = 110;
const F4_CL_T_E_M = 111;
const F5_CL_T_B_M = 112;
const F5_CL_T_T_M = 113;
const F5_CL_T_E_M = 114;

const F3_CL_T_B_P = 115;
const F3_CL_T_T_P = 116;
const F3_CL_T_E_P = 117;
const F4_CL_T_B_P = 118;
const F4_CL_T_T_P = 119;
const F4_CL_T_E_P = 120;
const F5_CL_T_B_P = 121;
const F5_CL_T_T_P = 122;
const F5_CL_T_E_P = 123;

const F3_WA_D_B_800 = 124;
const F3_WA_D_C_800 = 125;
const F3_WA_D_E_800 = 126;
const F4_WA_D_B_800 = 127;
const F4_WA_D_C_800 = 128;
const F4_WA_D_E_800 = 129;
const F5_WA_D_B_800 = 130;
const F5_WA_D_C_800 = 131;
const F5_WA_D_E_800 = 132;

const F3_WA_D_B_700 = 133;
const F3_WA_D_C_700 = 134;
const F3_WA_D_E_700 = 135;
const F4_WA_D_B_700 = 136;
const F4_WA_D_C_700 = 137;
const F4_WA_D_E_700 = 138;
const F5_WA_D_B_700 = 139;
const F5_WA_D_C_700 = 140;
const F5_WA_D_E_700 = 141;

const F3_WA_T_B_700 = 142;
const F3_WA_T_T_700 = 143;
const F3_WA_T_E_700 = 144;
const F4_WA_T_B_700 = 145;
const F4_WA_T_T_700 = 146;
const F4_WA_T_E_700 = 147;
const F5_WA_T_B_700 = 148;
const F5_WA_T_T_700 = 149;
const F5_WA_T_E_700 = 150;

const F3_WA_D_B_600 = 151;
const F3_WA_D_C_600 = 152;
const F3_WA_D_E_600 = 153;
const F4_WA_D_B_600 = 154;
const F4_WA_D_C_600 = 155;
const F4_WA_D_E_600 = 156;
const F5_WA_D_B_600 = 157;
const F5_WA_D_C_600 = 158;
const F5_WA_D_E_600 = 159;

const F3_WA_T_B_600 = 160;
const F3_WA_T_T_600 = 161;
const F3_WA_T_E_600 = 162;
const F4_WA_T_B_600 = 163;
const F4_WA_T_T_600 = 164;
const F4_WA_T_E_600 = 165;
const F5_WA_T_B_600 = 166;
const F5_WA_T_T_600 = 167;
const F5_WA_T_E_600 = 168;

//const F3_WA_T_B_M = 169;
//const F3_WA_T_T_M = 170;
const F3_WA_T_E_M = 171;
//const F4_WA_T_B_M = 172;
//const F4_WA_T_T_M = 173;
const F4_WA_T_E_M = 174;
//const F5_WA_T_B_M = 175;
//const F5_WA_T_T_M = 176;
const F5_WA_T_E_M = 177;

//const F3_WA_T_B_P = 178;
//const F3_WA_T_T_P = 179;
const F3_WA_T_E_P = 180;
//const F4_WA_T_B_P = 181;
//const F4_WA_T_T_P = 182;
const F4_WA_T_E_P = 183;
//const F5_WA_T_B_P = 184;
//const F5_WA_T_T_P = 185;
const F5_WA_T_E_P = 186;


router.get('/GenerateTestData', function (req, res, next) {
	let fs = require("fs"), path = require("path"), util = require("util");

	let content, data = {};

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "egg_collection_f1.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
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

	content = fs.readFileSync(path.join(__dirname, "../../model/data", "packaged_production_2.csv"), 'UTF8');
	content = content.split("\n");
	for (c = 1; c < content.length; c++) {
		let line = content[c].split(",");
		if (data[line[0]] == null) data[line[0]] = {[DATE]: line[0]};
		let d = data[line[0]];

		if (line[1] != "") d[F3_CL_D_B_800] = parseInt(line[1]);
		if (line[2] != "") d[F3_CL_D_C_800] = parseInt(line[2]);
		if (line[3] != "") d[F3_CL_D_E_800] = parseInt(line[3]);
		if (line[4] != "") d[F4_CL_D_B_800] = parseInt(line[4]);
		if (line[5] != "") d[F4_CL_D_C_800] = parseInt(line[5]);
		if (line[6] != "") d[F4_CL_D_E_800] = parseInt(line[6]);
		if (line[7] != "") d[F5_CL_D_B_800] = parseInt(line[7]);
		if (line[8] != "") d[F5_CL_D_C_800] = parseInt(line[8]);
		if (line[9] != "") d[F5_CL_D_E_800] = parseInt(line[9]);

		if (line[10] != "") d[F3_CL_D_B_700] = parseInt(line[10]);
		if (line[11] != "") d[F3_CL_D_C_700] = parseInt(line[11]);
		if (line[12] != "") d[F3_CL_D_E_700] = parseInt(line[12]);
		if (line[13] != "") d[F4_CL_D_B_700] = parseInt(line[13]);
		if (line[14] != "") d[F4_CL_D_C_700] = parseInt(line[14]);
		if (line[15] != "") d[F4_CL_D_E_700] = parseInt(line[15]);
		if (line[16] != "") d[F5_CL_D_B_700] = parseInt(line[16]);
		if (line[17] != "") d[F5_CL_D_C_700] = parseInt(line[17]);
		if (line[18] != "") d[F5_CL_D_E_700] = parseInt(line[18]);

		if (line[19] != "") d[F3_CL_T_B_700] = parseInt(line[19]);
		if (line[20] != "") d[F3_CL_T_T_700] = parseInt(line[20]);
		if (line[21] != "") d[F3_CL_T_E_700] = parseInt(line[21]);
		if (line[22] != "") d[F4_CL_T_B_700] = parseInt(line[22]);
		if (line[23] != "") d[F4_CL_T_T_700] = parseInt(line[23]);
		if (line[24] != "") d[F4_CL_T_E_700] = parseInt(line[24]);
		if (line[25] != "") d[F5_CL_T_B_700] = parseInt(line[25]);
		if (line[26] != "") d[F5_CL_T_T_700] = parseInt(line[26]);
		if (line[27] != "") d[F5_CL_T_E_700] = parseInt(line[27]);

		if (line[28] != "") d[F3_CL_D_B_600] = parseInt(line[28]);
		if (line[29] != "") d[F3_CL_D_C_600] = parseInt(line[29]);
		if (line[30] != "") d[F3_CL_D_E_600] = parseInt(line[30]);
		if (line[31] != "") d[F4_CL_D_B_600] = parseInt(line[31]);
		if (line[32] != "") d[F4_CL_D_C_600] = parseInt(line[32]);
		if (line[33] != "") d[F4_CL_D_E_600] = parseInt(line[33]);
		if (line[34] != "") d[F5_CL_D_B_600] = parseInt(line[34]);
		if (line[35] != "") d[F5_CL_D_C_600] = parseInt(line[35]);
		if (line[36] != "") d[F5_CL_D_E_600] = parseInt(line[36]);

		if (line[37] != "") d[F3_CL_T_B_600] = parseInt(line[37]);
		if (line[38] != "") d[F3_CL_T_T_600] = parseInt(line[38]);
		if (line[39] != "") d[F3_CL_T_E_600] = parseInt(line[39]);
		if (line[40] != "") d[F4_CL_T_B_600] = parseInt(line[40]);
		if (line[41] != "") d[F4_CL_T_T_600] = parseInt(line[41]);
		if (line[42] != "") d[F4_CL_T_E_600] = parseInt(line[42]);
		if (line[43] != "") d[F5_CL_T_B_600] = parseInt(line[43]);
		if (line[44] != "") d[F5_CL_T_T_600] = parseInt(line[44]);
		if (line[45] != "") d[F5_CL_T_E_600] = parseInt(line[45]);

		if (line[46] != "") d[F3_CL_T_E_M] = parseInt(line[46]);
		if (line[47] != "") d[F4_CL_T_E_M] = parseInt(line[47]);
		if (line[48] != "") d[F5_CL_T_E_M] = parseInt(line[48]);

		if (line[49] != "") d[F3_CL_T_E_P] = parseInt(line[49]);
		if (line[50] != "") d[F4_CL_T_E_P] = parseInt(line[50]);
		if (line[51] != "") d[F5_CL_T_E_P] = parseInt(line[51]);


		if (line[52] != "") d[F3_WA_D_B_800] = parseInt(line[52]);
		if (line[53] != "") d[F3_WA_D_C_800] = parseInt(line[53]);
		if (line[54] != "") d[F3_WA_D_E_800] = parseInt(line[54]);
		if (line[55] != "") d[F4_WA_D_B_800] = parseInt(line[55]);
		if (line[56] != "") d[F4_WA_D_C_800] = parseInt(line[56]);
		if (line[57] != "") d[F4_WA_D_E_800] = parseInt(line[57]);
		if (line[58] != "") d[F5_WA_D_B_800] = parseInt(line[58]);
		if (line[59] != "") d[F5_WA_D_C_800] = parseInt(line[59]);
		if (line[60] != "") d[F5_WA_D_E_800] = parseInt(line[60]);

		if (line[61] != "") d[F3_WA_D_B_700] = parseInt(line[61]);
		if (line[62] != "") d[F3_WA_D_C_700] = parseInt(line[62]);
		if (line[63] != "") d[F3_WA_D_E_700] = parseInt(line[63]);
		if (line[64] != "") d[F4_WA_D_B_700] = parseInt(line[64]);
		if (line[65] != "") d[F4_WA_D_C_700] = parseInt(line[65]);
		if (line[66] != "") d[F4_WA_D_E_700] = parseInt(line[66]);
		if (line[67] != "") d[F5_WA_D_B_700] = parseInt(line[67]);
		if (line[68] != "") d[F5_WA_D_C_700] = parseInt(line[68]);
		if (line[69] != "") d[F5_WA_D_E_700] = parseInt(line[69]);

		if (line[70] != "") d[F3_WA_T_B_700] = parseInt(line[70]);
		if (line[71] != "") d[F3_WA_T_T_700] = parseInt(line[71]);
		if (line[72] != "") d[F3_WA_T_E_700] = parseInt(line[72]);
		if (line[73] != "") d[F4_WA_T_B_700] = parseInt(line[73]);
		if (line[74] != "") d[F4_WA_T_T_700] = parseInt(line[74]);
		if (line[75] != "") d[F4_WA_T_E_700] = parseInt(line[75]);
		if (line[76] != "") d[F5_WA_T_B_700] = parseInt(line[76]);
		if (line[77] != "") d[F5_WA_T_T_700] = parseInt(line[77]);
		if (line[78] != "") d[F5_WA_T_E_700] = parseInt(line[78]);

		if (line[79] != "") d[F3_WA_D_B_600] = parseInt(line[79]);
		if (line[80] != "") d[F3_WA_D_C_600] = parseInt(line[80]);
		if (line[81] != "") d[F3_WA_D_E_600] = parseInt(line[81]);
		if (line[82] != "") d[F4_WA_D_B_600] = parseInt(line[82]);
		if (line[83] != "") d[F4_WA_D_C_600] = parseInt(line[83]);
		if (line[84] != "") d[F4_WA_D_E_600] = parseInt(line[84]);
		if (line[85] != "") d[F5_WA_D_B_600] = parseInt(line[85]);
		if (line[86] != "") d[F5_WA_D_C_600] = parseInt(line[86]);
		if (line[87] != "") d[F5_WA_D_E_600] = parseInt(line[87]);

		if (line[88] != "") d[F3_WA_T_B_600] = parseInt(line[88]);
		if (line[89] != "") d[F3_WA_T_T_600] = parseInt(line[89]);
		if (line[90] != "") d[F3_WA_T_E_600] = parseInt(line[90]);
		if (line[91] != "") d[F4_WA_T_B_600] = parseInt(line[91]);
		if (line[92] != "") d[F4_WA_T_T_600] = parseInt(line[92]);
		if (line[93] != "") d[F4_WA_T_E_600] = parseInt(line[93]);
		if (line[94] != "") d[F5_WA_T_B_600] = parseInt(line[94]);
		if (line[95] != "") d[F5_WA_T_T_600] = parseInt(line[95]);
		if (line[96] != "") d[F5_WA_T_E_600] = parseInt(line[96]);

		if (line[97] != "") d[F3_WA_T_E_M] = parseInt(line[97]);
		if (line[98] != "") d[F4_WA_T_E_M] = parseInt(line[98]);
		if (line[99] != "") d[F5_WA_T_E_M] = parseInt(line[99]);

		if (line[100] != "") d[F3_WA_T_E_P] = parseInt(line[100]);
		if (line[101] != "") d[F4_WA_T_E_P] = parseInt(line[101]);
		if (line[102] != "") d[F5_WA_T_E_P] = parseInt(line[102]);

	}

	Person.create({
		ID: 1234,
		Name: "Importer",
		Passcode: 1234,
		Active: true,
		Admin: true
	}).then(p => {
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
	let cdate = new moment(dv[DATE], 'DD/MM/YYYY');
	if (cdate == null) return null;
	return Registration.create({
		TimeIn: new moment(cdate).add(8, 'hour'),
		TimeOut: new moment(cdate).add(18, 'hour'),
		PersonID: p.ID
	}).then(r => {

			if (dv[F1_CLEAN_EGGS] != null || dv[F1_DIRTY_EGGS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 2,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
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
					return Promise.all(_p);
				});

			if (dv[F2_CLEAN_EGGS] != null || dv[F2_DIRTY_EGGS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 3,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
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
					return Promise.all(_p);
				});

			if (dv[F3_CLEAN_EGGS] != null || dv[F3_DIRTY_EGGS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 4,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
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
					return Promise.all(_p);
				});

			if (dv[F1_DEAD_HENS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 33,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F1_DEAD_HENS] != null) _p.push(TaskData.create({
						Value: dv[F1_DEAD_HENS],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 29
					}));
					return Promise.all(_p);
				});

			if (dv[F2_DEAD_HENS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 34,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F2_DEAD_HENS] != null) _p.push(TaskData.create({
						Value: dv[F2_DEAD_HENS],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 30
					}));

					return Promise.all(_p);
				});

			if (dv[F3_DEAD_HENS] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 35,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_DEAD_HENS] != null) _p.push(TaskData.create({
						Value: dv[F3_DEAD_HENS],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 31
					}));

					return Promise.all(_p);
				});

			if (dv[F1_POP] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 36,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F1_POP] != null) _p.push(TaskData.create({
						Value: dv[F1_POP],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 39
					}));

					return Promise.all(_p);
				});

			if (dv[F2_POP] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 37,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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
					let _p = [];
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

			if (dv[F3_CL_D_B_800] != null || dv[F3_CL_D_C_800] != null || dv[F3_CL_D_E_800] != null ||
				dv[F3_WA_D_B_800] != null || dv[F3_WA_D_C_800] != null || dv[F3_WA_D_E_800] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 52,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_CL_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 86
					}));

					if (dv[F3_CL_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 87
					}));

					if (dv[F3_CL_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 88
					}));

					//--------------------------------------------------------
					if (dv[F3_WA_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 92
					}));

					if (dv[F3_WA_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 93
					}));

					if (dv[F3_WA_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 96
					}));

					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F4_CL_D_B_800] != null || dv[F4_CL_D_C_800] != null || dv[F4_CL_D_E_800] != null ||
				dv[F4_WA_D_B_800] != null || dv[F4_WA_D_C_800] != null || dv[F4_WA_D_E_800] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 55,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F4_CL_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 117
					}));

					if (dv[F4_CL_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 118
					}));

					if (dv[F4_CL_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 121
					}));


					if (dv[F4_WA_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 122
					}));

					if (dv[F4_WA_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 123
					}));

					if (dv[F4_WA_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 126
					}));

					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F5_CL_D_B_800] != null || dv[F5_CL_D_C_800] != null || dv[F5_CL_D_E_800] != null ||
				dv[F5_WA_D_B_800] != null || dv[F5_WA_D_C_800] != null || dv[F5_WA_D_E_800] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 58,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F5_CL_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 147
					}));

					if (dv[F5_CL_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 148
					}));

					if (dv[F5_CL_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 151
					}));


					if (dv[F5_WA_D_B_800] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_B_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 152
					}));

					if (dv[F5_WA_D_C_800] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_C_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 153
					}));

					if (dv[F5_CL_D_E_800] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_E_800],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 156
					}));


					//console.log(tc);
					return Promise.all(_p);
				});

			//--------------------------------------------------------

			if (dv[F3_CL_D_B_700] != null || dv[F3_CL_D_C_700] != null || dv[F3_CL_D_E_700] != null ||
				dv[F3_WA_D_B_700] != null || dv[F3_WA_D_C_700] != null || dv[F3_WA_D_E_700] != null ||
				dv[F3_CL_T_B_700] != null || dv[F3_CL_T_T_700] != null || dv[F3_CL_T_E_700] != null ||
				dv[F3_WA_T_B_700] != null || dv[F3_WA_T_T_700] != null || dv[F3_WA_T_E_700] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 53,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_CL_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 97
					}));

					if (dv[F3_CL_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 98
					}));

					if (dv[F3_CL_T_B_700] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 99
					}));

					if (dv[F3_CL_T_T_700] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_T_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 100
					}));

					if (dv[F3_CL_D_E_700] != null || dv[F3_CL_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F3_CL_D_E_700] == null ? 0 : dv[F3_CL_D_E_700]) + (dv[F3_CL_T_E_700] == null ? 0 : dv[F3_CL_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 101
					}));

					if (dv[F3_WA_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 102
					}));

					if (dv[F3_WA_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 103
					}));

					if (dv[F3_WA_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 104
					}));

					if (dv[F3_WA_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 105
					}));

					if (dv[F3_WA_D_E_700] != null || dv[F3_WA_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F3_WA_D_E_700] == null ? 0 : dv[F3_WA_D_E_700]) + (dv[F3_WA_T_E_700] == null ? 0 : dv[F3_WA_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 106
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F4_CL_D_B_700] != null || dv[F4_CL_D_C_700] != null || dv[F4_CL_D_E_700] != null ||
				dv[F4_WA_D_B_700] != null || dv[F4_WA_D_C_700] != null || dv[F4_WA_D_E_700] != null ||
				dv[F4_CL_T_B_700] != null || dv[F4_CL_T_T_700] != null || dv[F4_CL_T_E_700] != null ||
				dv[F4_WA_T_B_700] != null || dv[F4_WA_T_T_700] != null || dv[F4_WA_T_E_700] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 56,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F4_CL_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 127
					}));

					if (dv[F4_CL_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 128
					}));

					if (dv[F4_CL_T_B_700] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 129
					}));

					if (dv[F4_CL_T_T_700] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_T_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 130
					}));

					if (dv[F4_CL_D_E_700] != null || dv[F4_CL_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F4_CL_D_E_700] == null ? 0 : dv[F4_CL_D_E_700]) + (dv[F4_CL_T_E_700] == null ? 0 : dv[F4_CL_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 131
					}));

					if (dv[F4_WA_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 132
					}));

					if (dv[F4_WA_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 133
					}));

					if (dv[F4_WA_T_B_700] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 134
					}));

					if (dv[F4_WA_T_T_700] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_T_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 135
					}));

					if (dv[F4_WA_D_E_700] != null || dv[F4_WA_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F4_WA_D_E_700] == null ? 0 : dv[F4_WA_D_E_700]) + (dv[F4_WA_T_E_700] == null ? 0 : dv[F4_WA_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 136
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F5_CL_D_B_700] != null || dv[F5_CL_D_C_700] != null || dv[F5_CL_D_E_700] != null ||
				dv[F5_WA_D_B_700] != null || dv[F5_WA_D_C_700] != null || dv[F5_WA_D_E_700] != null ||
				dv[F5_CL_T_B_700] != null || dv[F5_CL_T_T_700] != null || dv[F5_CL_T_E_700] != null ||
				dv[F5_WA_T_B_700] != null || dv[F5_WA_T_T_700] != null || dv[F5_WA_T_E_700] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 59,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F5_CL_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 157
					}));

					if (dv[F5_CL_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 158
					}));

					if (dv[F5_CL_T_B_700] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 159
					}));

					if (dv[F5_CL_T_T_700] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_T_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 160
					}));

					if (dv[F5_CL_D_E_700] != null || dv[F5_CL_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F5_CL_D_E_700] == null ? 0 : dv[F5_CL_D_E_700]) + (dv[F5_CL_T_E_700] == null ? 0 : dv[F5_CL_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 161
					}));

					if (dv[F5_WA_D_B_700] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 162
					}));

					if (dv[F5_WA_D_C_700] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_C_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 163
					}));

					if (dv[F5_WA_T_B_700] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_B_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 164
					}));

					if (dv[F5_WA_T_T_700] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_T_700],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 165
					}));

					if (dv[F5_WA_D_E_700] != null || dv[F5_WA_T_E_700 != null]) _p.push(TaskData.create({
						Value: (dv[F5_WA_D_E_700] == null ? 0 : dv[F5_WA_D_E_700]) + (dv[F5_WA_T_E_700] == null ? 0 : dv[F5_WA_T_E_700]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 166
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			//--------------------------------------------------------

			if (dv[F3_CL_D_B_600] != null || dv[F3_CL_D_C_600] != null || dv[F3_CL_D_E_600] != null ||
				dv[F3_WA_D_B_600] != null || dv[F3_WA_D_C_600] != null || dv[F3_WA_D_E_600] != null ||
				dv[F3_CL_T_B_600] != null || dv[F3_CL_T_T_600] != null || dv[F3_CL_T_E_600] != null ||
				dv[F3_WA_T_B_600] != null || dv[F3_WA_T_T_600] != null || dv[F3_WA_T_E_600] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 54,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_CL_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 107
					}));

					if (dv[F3_CL_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 108
					}));

					if (dv[F3_CL_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 109
					}));

					if (dv[F3_CL_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 110
					}));

					if (dv[F3_CL_D_E_600] != null || dv[F3_CL_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F3_CL_D_E_600] == null ? 0 : dv[F3_CL_D_E_600]) + (dv[F3_CL_T_E_600] == null ? 0 : dv[F3_CL_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 111
					}));

					if (dv[F3_WA_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 112
					}));

					if (dv[F3_WA_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 113
					}));

					if (dv[F3_WA_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 114
					}));

					if (dv[F3_WA_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 115
					}));

					if (dv[F3_WA_D_E_600] != null || dv[F3_WA_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F3_WA_D_E_600] == null ? 0 : dv[F3_WA_D_E_600]) + (dv[F3_WA_T_E_600] == null ? 0 : dv[F3_WA_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 116
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F4_CL_D_B_600] != null || dv[F4_CL_D_C_600] != null || dv[F4_CL_D_E_600] != null ||
				dv[F4_WA_D_B_600] != null || dv[F4_WA_D_C_600] != null || dv[F4_WA_D_E_600] != null ||
				dv[F4_CL_T_B_600] != null || dv[F4_CL_T_T_600] != null || dv[F4_CL_T_E_600] != null ||
				dv[F4_WA_T_B_600] != null || dv[F4_WA_T_T_600] != null || dv[F4_WA_T_E_600] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 57,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F4_CL_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 137
					}));

					if (dv[F4_CL_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 138
					}));

					if (dv[F4_CL_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 139
					}));

					if (dv[F4_CL_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 140
					}));

					if (dv[F4_CL_D_E_600] != null || dv[F4_CL_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F4_CL_D_E_600] == null ? 0 : dv[F4_CL_D_E_600]) + (dv[F4_CL_T_E_600] == null ? 0 : dv[F4_CL_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 141
					}));

					if (dv[F4_WA_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 142
					}));

					if (dv[F4_WA_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 143
					}));

					if (dv[F4_WA_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 144
					}));

					if (dv[F4_WA_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 145
					}));

					if (dv[F4_WA_D_E_600] != null || dv[F4_WA_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F4_WA_D_E_600] == null ? 0 : dv[F4_WA_D_E_600]) + (dv[F4_WA_T_E_600] == null ? 0 : dv[F4_WA_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 146
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F5_CL_D_B_600] != null || dv[F5_CL_D_C_600] != null || dv[F5_CL_D_E_600] != null ||
				dv[F5_WA_D_B_600] != null || dv[F5_WA_D_C_600] != null || dv[F5_WA_D_E_600] != null ||
				dv[F5_CL_T_B_600] != null || dv[F5_CL_T_T_600] != null || dv[F5_CL_T_E_600] != null ||
				dv[F5_WA_T_B_600] != null || dv[F5_WA_T_T_600] != null || dv[F5_WA_T_E_600] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 60,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F5_CL_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 167
					}));

					if (dv[F5_CL_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 168
					}));

					if (dv[F5_CL_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 169
					}));

					if (dv[F5_CL_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 170
					}));

					if (dv[F5_CL_D_E_600] != null || dv[F5_CL_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F5_CL_D_E_600] == null ? 0 : dv[F5_CL_D_E_600]) + (dv[F5_CL_T_E_600] == null ? 0 : dv[F5_CL_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 171
					}));

					if (dv[F5_WA_D_B_600] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 172
					}));

					if (dv[F5_WA_D_C_600] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_D_C_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 173
					}));

					if (dv[F5_WA_T_B_600] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_B_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 174
					}));

					if (dv[F5_WA_T_T_600] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_T_600],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 175
					}));

					if (dv[F5_WA_D_E_600] != null || dv[F5_WA_T_E_600 != null]) _p.push(TaskData.create({
						Value: (dv[F5_WA_D_E_600] == null ? 0 : dv[F5_WA_D_E_600]) + (dv[F5_WA_T_E_600] == null ? 0 : dv[F5_WA_T_E_600]),
						TaskCompletionId: tc.id,
						TaskDataFieldId: 176
					}));


					//console.log(tc);
					return Promise.all(_p);
				});

			//---------------------------------------------------------------------------------------------

			if (dv[F3_CL_T_E_M] != null || dv[F3_WA_T_E_M] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 61,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_CL_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 181
					}));

					if (dv[F3_WA_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 186
					}));


					//console.log(tc);
					return Promise.all(_p);
				});

			if (dv[F4_CL_T_E_M] != null || dv[F4_WA_T_E_M] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 63,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F4_CL_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 201
					}));

					if (dv[F4_WA_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 206
					}));


					//console.log(tc);
					return Promise.all(_p);
				});

			if (dv[F5_CL_T_E_M] != null || dv[F5_WA_T_E_M] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 65,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F5_CL_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 221
					}));

					if (dv[F5_WA_T_E_M] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_E_M],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 226
					}));


					//console.log(tc);
					return Promise.all(_p);
				});


			//---------------------------------------------------------------------------------------------

			if (dv[F3_CL_T_E_P] != null || dv[F3_WA_T_E_P] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 62,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F3_CL_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F3_CL_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 191
					}));

					if (dv[F3_WA_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F3_WA_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 196
					}));

					//console.log(tc);
					return Promise.all(_p);
				});

			if (dv[F4_CL_T_E_P] != null || dv[F4_WA_T_E_P] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 64,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F4_CL_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F4_CL_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 211
					}));

					if (dv[F4_WA_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F4_WA_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 216
					}));

					//console.log(tc);
					return Promise.all(_p);
				});


			if (dv[F5_CL_T_E_P] != null || dv[F5_WA_T_E_P] != null)
				TaskCompletion.create({
					CompletedAt: new moment(r.TimeIn).add(1, 'hour'),
					TaskId: 66,
					RegistrationId: r.id
				}).then(tc => {
					let _p = [];
					if (dv[F5_CL_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F5_CL_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 231
					}));

					if (dv[F5_WA_T_E_P] != null) _p.push(TaskData.create({
						Value: dv[F5_WA_T_E_P],
						TaskCompletionId: tc.id,
						TaskDataFieldId: 236
					}));

					//console.log(tc);
					return Promise.all(_p);
				});

		}
	).error(e => {
		console.log(e);
	});
};
