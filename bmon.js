var app = app || {};

app.deps = {
	os		: require('os'),
	fs		: require('fs'),
	ev		: require('events'),
//	un		: require('underscore'),
	cliff	: require('cliff'),
}

app.defs = {
	MODE	: {
		CLI	: 0,
		WEB	: 1,
	},
	LAYOUT: {
		NORMAL	: 0,
		TOTAL	: 1,
	},
	ORDER: {
		NORMAL	: 0,
	},
	CLI	: {
		ORDER	: 0,
		LAYOUT	: 0,
	},
	pnd_all	: [],
	colors	: [ 'bold', 'bold', 'bold', 'bold', 'bold', 'bold', 'bold', 'bold', 'bold', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white',  ],
}

/* config */
app.c = {
	argv	: process.argv,
	mode	: {
		val	: app.defs.MODE.CLI,
		fn	: {},
	},
	intfs	: {},
	ivals	: {
		interfaces	: 1*1000,
	},
	count	: 0,
	ev		: new app.deps.ev.EventEmitter(),
}


/*                RX                                                                  TX
Interface bytes packets errors fifo frame compressed multicast bytes packets errors drops fifo collisions carriers compressed
lo        655   2       0      0    0     0          0         0     655     2      0     0     0          0       0          0
lo:		112044 110825   0      0   0      0           0         0    1124   110    0     0          0       0          0        0

face             |bytes   packets  errs      drop  fifo  frame  compressed  multicast|bytes  packets   errs  drop     fifo  colls  carrier  compressed
lo:112044884     110825   0        0         0     0     0      0           112044884        110825    0     0        0     0      0        0
eth0:1216522637  1667771  0        0         0     0     0      0           1161180636       7383991   0     0        0     0      0        0
tun0:40253967    280690   0        0         0     0     0      0           761322586        18732812  0     9137200  0     0      0        0
vmnet1:          0        0        0         0     0     0      0           0                0         6     0        0     0      0        0           0
vmnet8:          0        0        0         0     0     0      0           0                0         6     0        0     0      0        0           0
sit0:            0        0        0         0     0     0      0           0                0         0     0        0     0      0        0           0
sit1:186790535   129506   0        0         0     0     0      0           5947577          79991     0     0        0     0      0        0
vboxnet0:        0        0        0         0     0     0      0           0                113502    962   0        0     0      0        0           0
*/

app.defs.pnd = {
	/* Usually i'd do this stuff from a function, less lines of code etc. But I need some whitespace */
		0: {
			t: "",
			n: "Interface",
		},
		1: {
			t: "RX",
			n: "bytes",
		},
		2: {
			t: "RX",
			n: "packets",
		},
		3: {
			t: "RX",
			n: "errors",
		},
		4: {
			t: "RX",
			n: "drops",
		},
		5: {
			t: "RX",
			n: "fifo",
		},
		6: {
			t: "RX",
			n: "frame",
		},
		7: {
			t: "RX",
			n: "compressed",
		},
		8: {
			t: "RX",
			n: "multicast",
		},
		9: {
			t: "TX",
			n: "bytes",
		},
		10: {
			t: "TX",
			n: "packets",
		},
		11: {
			t: "TX",
			n: "errors",
		},
		12: {
			t: "TX",
			n: "drops",
		},
		13: {
			t: "TX",
			n: "fifo",
		},
		14: {
			t: "TX",
			n: "collisions",
		},
		15: {
			t: "TX",
			n: "carriers",
		},
		16: {
			t: "TX",
			n: "compressed",
		},
};
	
	
app.mode = {
	cli	: {
		init	: function() {
			console.log("cli init");
			app.c.ev.on('update', function(data) {
				console.log("update!");
				var arr = [];
				arr[0] = app.defs.pnd_all;
				for(var v in app.c.intfs) {
					var intf = app.c.intfs[v];
//					console.log(v + ' zz: ', intf.nstats);
//					console.log(v + ' oo: ', intf.ostats);
//					console.log(v + ' RX: ', intf.rstats);
//					console.log(v + ' ..: ', intf.tstats);
//					console.log(v + ' to: ', intf.tot_stats);
					switch(app.defs.CLI.LAYOUT) {
						case app.defs.LAYOUT.NORMAL: {
							arr.push(intf.rstats);
							break;
						}
						case app.defs.LAYOUT.TOTAL: {
							arr.push(intf.tot_stats);
							break;
						}
						default: {
							arr.push(intf.rstats);
							break;
						}
					}
				}
				console.log(app.deps.cliff.stringifyRows(arr, app.defs.colors));
				
			
			});
		},
	},
}

app.fn = {};

app.fn.misc = {
/*
	handle : {
		interval : function() {
		},
	}
*/
	getInterfaces : function(cb) {
		app.deps.fs.readFile("/proc/net/dev", cb);
	},

	trim : function(str) {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
}

app.fn.init = {

	defaults : function() {
		app.c.mode.val	= app.defs.MODE.CLI;
		app.c.mode.fn	= app.mode.cli.init;

		for(var v in app.defs.pnd) {
			app.defs.pnd_all.push(app.defs.pnd[v].n);
		}
	},
	base : function() {
		console.log("base");
		/* defaults */
		app.fn.init.defaults()
		app.fn.init.argv();
		app.fn.init.poller.interfaces();
		app.c.mode.fn();
	},

	argv : function() {
		console.log("argv");	
		if(app.c.argv[0] == "node") {
			app.c.argv = app.c.argv.splice(1);
		}
console.log("l", app.c.argv.length, app.c.argv);
		if(app.c.argv.length > 1) {
			/* web */
			console.log("web");
		}
	},

	poller : {
		interfaces	: function() {
			setInterval(function() {
				console.log("intf");
				app.fn.misc.getInterfaces(function(err, data) {
					/* This is horrible */
					app.c.count += 1;
					data = data.toString();
					data = data.replace(/:/g, ' ');
					var lines = data.split('\n');
					var hash = {};
					var interface = "";
					lines = lines.splice(2);
					lines.forEach(function(val, index, array) {
						val = app.fn.misc.trim(val);
						val = val.split(/\s+/);
						hash = { 	
							state: {},
							nstats: val,
							ostats: {},	
							rstats: [],
							tstats: [],
							tot_stats: [],
						}

						interface = val[0];
						if(val[0].length > 0) {
							if(app.c.intfs[interface] != undefined) {
								var intf = app.c.intfs[interface];
								intf.ostats = {};
	//							intf.ostats = app.deps.un.clone(intf.nstats);
								intf.ostats = intf.nstats;
								intf.nstats = hash.nstats;
								intf.nstats.forEach(function(val, index) {
									if(index!=0) {
										intf.rstats[index] = intf.nstats[index] - intf.ostats[index];
										intf.tstats[index] = parseInt(intf.rstats[index]) / (app.c.ivals.interfaces/1000);
										intf.tot_stats[index] = parseInt(intf.nstats[index]) + parseInt(intf.ostats[index]);
	
									}
									else {
										intf.rstats[index] = val;
									}
								});
							}
							else {
								app.c.intfs[val[0]] = hash;
							}
						}
						//array[index] = val;
						//return l;
					})

					app.c.ev.emit('update');
	
//					console.log(app.c.intfs);
				});
			}, app.c.ivals.interfaces);
		},
	}
	
}

app.fn.init.base();
