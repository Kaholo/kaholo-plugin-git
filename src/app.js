var git = require ("simple-git");
var url = require('url');

function _getRepoUrl(repoUrl, user, password){
    let parsedUrl = url.parse(repoUrl);
    return `${parsedUrl.protocol || 'https:'}//${user}:${password}@${(parsedUrl.hostname || '')}${parsedUrl.pathname}`;
}

function clone(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER || settings.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let folder = action.params.FOLDER;
		let repo = action.params.REPO;
        let remote = _getRepoUrl(repo,user,password);
        
        git()
			.outputHandler(function(command, stdout, stderr){
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.silent(true)
			.clone(remote, folder, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
			})
	})

}

function checkOut(action) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let checkoutWhat = action.params.BRANCH || action.params.TAG;
		let folder = action.params.FOLDER;
		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.checkout(checkoutWhat, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
		})
	})

}


function pull(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER || settings.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let folder = action.params.FOLDER;
        let repo = action.params.REPO;
        let remote = _getRepoUrl(repo,user,password);

		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.pull(remote, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
		})
	})
}


function pushTag(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER || settings.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let repo = action.params.REPO;
		let folder = action.params.FOLDER;
		let tag = action.params.TAG;
		let message = action.params.MESSAGE;
		
		let remote = _getRepoUrl(repo,user,password);
        
		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.tag(['-a',tag,'-m',message])
			.pushTags(remote, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
			})
	})
}

module.exports = {
	clone: clone,
	checkOutBranch: checkOut,
	checkOutTag: checkOut,
	// pull: pull,
	pushTag: pushTag
}