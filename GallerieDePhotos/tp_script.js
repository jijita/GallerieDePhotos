$(document).ready(function() {
	var btnCam = document.querySelector("#cam"),
		btnSaveToGlr = document.querySelector("#saveToGlr"),
		btnDownload = document.querySelector("#download"),
		divCanvas = document.querySelector("#divCanvas"),
		buttons = document.querySelectorAll(".btn-group button"),
		res = localStorage.getItem("save");
	
	$(btnCam).one("click", afficherVideo);
	$(btnSaveToGlr).on("click", ajouterDansGlr);
	$(btnDownload).on("click", downloadImage);
	
	$(buttons).tooltip();
	
	if (res != null) {
		document.querySelector(".carousel-inner").innerHTML = JSON.parse(res);
	}
	
	var leCarousel = document.querySelector(".carousel");
	$(leCarousel).carousel({
		interval : 1000});
	$(leCarousel).carousel("cycle");
	
	divCanvas.addEventListener("dragover", function(e) {
		e.preventDefault();		
	}, false);
	
	divCanvas.addEventListener("drop", dropper, false);
	
	$(document.querySelectorAll(".carousel-inner img")).on("click", afficherPleinEcran);
});

var localStream = null,
	lienImg = null,
	glyphs = {
		"video" : '<span class="glyphicon glyphicon-facetime-video"></span>',
		"picture" : '<span class="glyphicon glyphicon-picture"></span>',
		"floppy" : '<span class="glyphicon glyphicon-floppy-disk"></span>',
		"download" : '<span class="glyphicon glyphicon-download"></span>'
	};

function afficherVideo(e) {
	var monCanvas = document.querySelector("#monCanvas"),
		maCam = document.querySelector("#maCam"),
		inputs = document.querySelectorAll(".form-group input"),
		thisButton = e.currentTarget;
		
	$(monCanvas).addClass("hidden");
	$(maCam).removeClass("hidden");
	
	lienImg = null;
	
	$(inputs).off();
	
	navigator.getUserMedia = navigator.getUserMedia 
							|| navigator.webkitGetUserMedia 
							|| navigator.mozGetUserMedia 
							|| navigator.msGetUserMedia 
							|| navigator.oGetUserMedia;
	
	if (navigator.getUserMedia) {
		navigator.getUserMedia({ video : true },
			function(stream) {
				maCam.src = window.URL.createObjectURL(stream);
				maCam.play();
				
				localStream = stream;
			},
			function(error) {
				console.log(error);
			});
	}
	
	thisButton.innerHTML = glyphs["picture"];
	$(thisButton).tooltip("destroy");
	$(thisButton).tooltip();
	thisButton.setAttribute("title", "Snapshot");	
	$(thisButton).one("click", captureImage);
}

/*Fonction servant a prendre un snapshot de la camera.
Ne s'active que si la fontion afficherVideo a ete triggered.*/
function captureImage(e) {
	var monCanvas = document.querySelector("#monCanvas"),
		maCam = document.querySelector("#maCam"),
		inputs = document.querySelectorAll(".form-group input"),
		thisButton = e.currentTarget;
	
	$(maCam).addClass("hidden");
	$(monCanvas).removeClass("hidden");
	
	monCanvas.width = maCam.videoWidth;
    monCanvas.height = maCam.videoHeight;
    monCanvas.getContext('2d').drawImage(maCam, 0, 0, monCanvas.width, monCanvas.height);
	
	maCam.pause();
	localStream.stop();
	localStream = null;
	
	var img = new Image();
	img.src = monCanvas.toDataURL();
	lienImg = img.src;
	
	$(inputs).on("change", { cleImg : img }, changerCouleur);
	
	thisButton.innerHTML = glyphs["video"];
	$(thisButton).tooltip("destroy");
	$(thisButton).tooltip();
	thisButton.setAttribute("title", "Allumer camera");	
	$(thisButton).one("click", afficherVideo);
}

function ajouterDansGlr() {
	var monCarousel = document.querySelector("#monCarousel");

	if (lienImg != null) {
		var divImage = document.createElement("div");
		divImage.setAttribute("class", "item");
		
		var image = document.createElement("img");
		image.src = lienImg;	
		divImage.appendChild(image);
		
		$(image).on("click", afficherPleinEcran);
		
		var leCarousel = document.querySelector(".carousel"),
			inner = document.querySelector(".carousel-inner");
		inner.appendChild(divImage);	
		
		var toutes = document.querySelector(".carousel-inner div");
		$(toutes).removeClass("active");
		$(toutes[0]).addClass("active");
		
		$(leCarousel).carousel({
			interval : 1000});
		$(leCarousel).carousel("cycle");
		
		var contenu = inner.innerHTML;
		localStorage.setItem("save", JSON.stringify(contenu));
	}
}

/*Fonction pour downloader l'image dans le dossier download par defaut du browser.
L'image est downloader avec un nom aleatoire et une extension .png
*/
function downloadImage() {
	var a = document.createElement("a"),
		e;	
	
	a.download = (Math.random() * 100000000).toFixed(0) + ".png";
	a.href = document.querySelector("#monCanvas").toDataURL();
	
	if (document.createEvent) {
		e = document.createEvent("MouseEvents");
		e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		a.dispatchEvent(e);
	} else if (a.fireEvent) {
		a.fireEvent("onClick");
	}	
}

/*Fontion servant a appliquer un fond de couleur au canvas.
Se fait en dessinat un rectangle de couleur qui s'additionnera aux couleurs du canvas
*/
function changerCouleur(e) {
	var img = e.data.cleImg,
		monCanvas = document.querySelector("#monCanvas"),
		ctx = monCanvas.getContext("2d"),
		rouge = document.querySelector("#range-red").value,
		vert = document.querySelector("#range-green").value,
		bleu = document.querySelector("#range-blue").value;
	
	ctx.clearRect(0, 0, monCanvas.width, monCanvas.height);
	ctx.drawImage(img, 0, 0);
	
	ctx.globalCompositeOperation = "lighter";
	ctx.fillStyle = "rgba(" + rouge + "," + vert + "," + bleu + ", 1)";
	ctx.fillRect(0 ,0 , monCanvas.width, monCanvas.height);
	
	lienImg = monCanvas.toDataURL();
}

/*Fonction pour l'affichage modal d'une image se trouvant dans la gallerie.
Consite a copier la source de l'image selectionnee dans une autre se trouvant
dans une div modal que l'on affiche ensuite.*/
function afficherPleinEcran(e) {
	var imgSrc = e.currentTarget.src;
	
	var img = document.querySelector("#leImg");
	img.src = imgSrc;	
	
	img.addEventListener("load", function() {
		document.querySelector(".modal-content").appendChild(img);		
	}, false);
	
	$(".modal").modal("toggle");
	
	$("#btnSupp").off();
	$("#btnSupp").one("click", {cleImg : e.currentTarget}, supprimerPhoto);		
}

function supprimerPhoto(e) {
	var image = e.data.cleImg;
	$(image.parentNode).remove();
	
	$(".modal").modal("toggle");
	
	var contenu = document.querySelector(".carousel-inner").innerHTML;
	localStorage.setItem("save", JSON.stringify(contenu));
}

/*Fonction qui gere le drag and drop.
Peut differencier entre fichier et balise html
mais a le meme fonctionnement a la base: une image est dropper sur le canvas et on peut commencer
a le modifier
*/
function dropper(e) {
	e.preventDefault();
	
	var fichier = e.dataTransfer.files[0],
		inputs = document.querySelectorAll(".form-group input"),
		url = window.URL || window.webkitURL,
		imageUrl, 
		image;
	
	if (url) {
		var monCanvas = document.querySelector("#monCanvas"),
			maCam = document.querySelector("#maCam"),
			btnCam = document.querySelector("#cam");
		
		btnCam.innerHTML = glyphs["video"];
		$(btnCam).tooltip("destroy");
		$(btnCam).tooltip();
		btnCam.setAttribute("title", "Allumer camera");		
		$(btnCam).off();
		$(btnCam).one("click", afficherVideo);		
		
		$(maCam).addClass("hidden");
		$(monCanvas).removeClass("hidden");
		
		if (localStream != null) {
			maCam.pause();
			localStream.stop();
			localStream = null;
		}
		
		if (fichier == undefined) {
			imageUrl = e.dataTransfer.getData("text");
		} else {
			imageUrl = url.createObjectURL(fichier);
		}
		
		image = new Image();
		
		image.addEventListener("load", function(e) {
			url.revokeObjectURL(imageUrl);
			
			monCanvas.width = image.width;
			monCanvas.height = image.height;
			
			monCanvas.getContext("2d").clearRect(0, 0, monCanvas.width, monCanvas.height);
			monCanvas.getContext("2d").drawImage(image, 0, 0, monCanvas.width, monCanvas.height);			
			
			lienImg = image.src;
			
			$(inputs).on("change", { cleImg : image }, changerCouleur);
		}, false);
		
		image.src = imageUrl;
	}
}