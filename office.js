let versionSelect, colorSelect;

Office.onReady((info) => {
	if (info.host === Office.HostType.Word) {
		document.getElementById("sideload-msg").style.display = "none";
		document.getElementById("app-body").style.display = "flex";
		document.getElementById("run").onclick = getDocumentAsCompressed;
	}
});

function getDocumentAsCompressed() {
	document.getElementById("loader_parent").style.display = "flex"
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

	console.log(window.btoa(fileContent));

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