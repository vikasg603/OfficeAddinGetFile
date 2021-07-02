
Office.onReady((info) => {
	if (info.host === Office.HostType.Word) {
		document.getElementById("sideload-msg").style.display = "none";
		document.getElementById("app-body").style.display = "flex";
		document.getElementById("run").onclick = getDocumentAsCompressed;
	}
});

function getFileUrl() {
	return new Promise((resolve, reject) => {
		//Get the URL of the current file.
		Office.context.document.getFilePropertiesAsync(function (asyncResult) {
			const fileUrl = asyncResult.value.url;
			if (fileUrl == "") {
				showMessage("The file hasn't been saved yet. Save the file and try again");
				reject();
			}
			else {
				resolve(fileUrl);
			}
		});
	})
}

function getDocumentAsCompressed() {
	document.getElementById("loader_parent").style.display = "flex"

	getFileUrl().then(title => {
		window.title = title;
		Office.context.document.getFileAsync(Office.FileType.Pdf, { sliceSize: 65536 /*64 KB*/ },
			function (result) {
				if (result.status == "succeeded") {
					// If the getFileAsync call succeeded, then
					// result.value will return a valid File Object.
					var myFile = result.value;
					var sliceCount = myFile.sliceCount;
					var slicesReceived = 0, gotAllSlices = true, docdataSlices = [];
					//app.showNotification("File size:" + myFile.size + " #Slices: " + sliceCount);
	
					// Get the file slices.
					getSliceAsync(myFile, 0, sliceCount, gotAllSlices, docdataSlices, slicesReceived);
				}
				else {
					app.showNotification("Error:", result.error.message);
					document.getElementById("loader-parent").style.display = "none";
				}
			});
	}).catch(err => console.log(err));
}

function onGotAllSlices(docdataSlices) {
	var docdata = [];
	for (var i = 0; i < docdataSlices.length; i++) {
		docdata = docdata.concat(docdataSlices[i]);
	}

	var fileContent = new String();
	for (var j = 0; j < docdata.length; j++) {
		fileContent += String.fromCharCode(docdata[j]);
	}

	const PDFDoc = window.btoa(fileContent);

	document.getElementById("loading_text").innerText = "Converting to ePub "
	axios.defaults.headers.post['Content-Type'] ='application/json';
	const FileName = decodeURI(window.title.split('/').slice(-1)[0]);
	axios.post('https://3.8.40.182/ProcessBase64PDF', {
		doc: PDFDoc,
		title: FileName.split('.')[0]
	}).then(resp => {
		document.getElementById("loader_parent").style.display = "none";
		document.getElementById("loading_text").innerText = "Processing Docs "
		window.location = resp.data.url;
	}).catch(console.log);

	// Now all the file content is stored in 'fileContent' variable,
	// you can do something with it, such as print, fax...
}

function getSliceAsync(file, nextSlice, sliceCount, gotAllSlices, docdataSlices, slicesReceived) {
	file.getSliceAsync(nextSlice, function (sliceResult) {
		if (sliceResult.status == "succeeded") {
			if (!gotAllSlices) { // Failed to get all slices, no need to continue.
				return;
			}

			// Got one slice, store it in a temporary array.
			// (Or you can do something else, such as
			// send it to a third-party server.)
			docdataSlices[sliceResult.value.index] = sliceResult.value.data;
			if (++slicesReceived == sliceCount) {
				// All slices have been received.
				file.closeAsync();
				onGotAllSlices(docdataSlices);
			}
			else {
				getSliceAsync(file, ++nextSlice, sliceCount, gotAllSlices, docdataSlices, slicesReceived);
			}
		}
		else {
			gotAllSlices = false;
			file.closeAsync();
			document.getElementById("loader-parent").style.display = "none";
			app.showNotification("getSliceAsync Error:", sliceResult.error.message);
		}
	});
}