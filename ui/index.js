var objectUrl;
var durationMusic;
const endPoint = "http://localhost:8080/list";
var listAudio;
var playListItems;
// musics info
$("#file").change(function (e) {
  var data = new FormData();
  jQuery.each(jQuery('#files')[0].files, function (i, file) {
    data.append('files-' + i, file);
  });

  jQuery.ajax({
    url: 'http://localhost:8080/import',
    data: data,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    type: 'POST', // For jQuery < 1.9
    success: function (data) {
      alert(data);
    }
  });


});




// create track item
function createTrackItem(index, name, duration) {

  var trackItem = document.createElement('div');
  trackItem.setAttribute("class", "playlist-track-ctn");
  trackItem.setAttribute("id", "ptc-" + index);
  trackItem.setAttribute("data-index", index);
  document.querySelector(".playlist-ctn").appendChild(trackItem);
  console.log(index)



  var playBtnItem = document.createElement('div');
  playBtnItem.setAttribute("class", "playlist-btn-play");
  playBtnItem.setAttribute("id", "pbp-" + index);
  document.querySelector("#ptc-" + index).appendChild(playBtnItem);

  var btnImg = document.createElement('i');
  btnImg.setAttribute("class", "fas fa-play");
  btnImg.setAttribute("height", "40");
  btnImg.setAttribute("width", "40");
  btnImg.setAttribute("id", "p-img-" + index);
  document.querySelector("#pbp-" + index).appendChild(btnImg);

  var trackInfoItem = document.createElement('div');
  trackInfoItem.setAttribute("class", "playlist-info-track");
  trackInfoItem.innerHTML = name
  document.querySelector("#ptc-" + index).appendChild(trackInfoItem);

  var trackDurationItem = document.createElement('div');
  trackDurationItem.setAttribute("class", "playlist-duration");
  trackDurationItem.innerHTML = duration
  document.querySelector("#ptc-" + index).appendChild(trackDurationItem);

  var btnFav = document.createElement('div');
  btnFav.setAttribute("class", "fas fa-heart");
  btnFav.setAttribute("height", "40");
  btnFav.setAttribute("width", "40");
  btnFav.setAttribute("id", "p-img-" + index);
  document.querySelector("#ptc-" + index).appendChild(btnFav);

  var btnDelete = document.createElement('div');
  btnDelete.setAttribute("class", "fas fa-trash");
  btnDelete.setAttribute("height", "40");
  btnDelete.setAttribute("width", "40");
  btnDelete.setAttribute("id", "p-img-" + index);
  document.querySelector("#ptc-" + index).appendChild(btnDelete);
}

async function updateDatas() {

  const res = await fetch(endPoint)
  const json = await res.json();
  listAudio = json.result;
  console.log(json.result)
  for (var i = 0; i < listAudio.length; i++) {
    createTrackItem(i, listAudio[i].name, listAudio[i].id);
  }
  if (listAudio.length > 0) {
    $(".player-ctn").show();
    $(".uploadRow").show();
  }
  else {
    $(".player-ctn").show();
    $(".uploadRow").show();
  }
  playListItems = document.querySelectorAll(".playlist-track-ctn");

  for (let i = 0; i < playListItems.length; i++) {
    playListItems[i].addEventListener("click", getClickedElement.bind(this));
  }

}

updateDatas();



function upload() {
  $(".player-ctn").hide();
  $(".uploadRow").show();
}




var indexAudio = 0;

function loadNewTrack(index) {
  var player = document.querySelector('#source-audio')
  var song = listAudio[index];
  console.log(song)
  player.src = "http://localhost:8080/song/" + song.id;
  document.querySelector('.title').innerHTML = song.name;
  this.currentAudio = document.getElementById("myAudio");
  this.currentAudio.load()
  this.toggleAudio()
  this.updateStylePlaylist(this.indexAudio, index)
  this.indexAudio = index;
}



function getClickedElement(event) {
  for (let i = 0; i < playListItems.length; i++) {
    if (playListItems[i] == event.target) {
      var clickedIndex = event.target.getAttribute("data-index")
      if (clickedIndex == this.indexAudio) { // alert('Same audio');
        this.toggleAudio()
      } else {
        loadNewTrack(clickedIndex);
      }
    }
  }
}




var currentAudio = document.getElementById("myAudio");

currentAudio.load()

currentAudio.onloadedmetadata = function () {
  document.getElementsByClassName('duration')[0].innerHTML = this.getMinutes(this.currentAudio.duration)
}.bind(this);

var interval1;

function toggleAudio() {

  if (this.currentAudio.paused) {
    document.querySelector('#icon-play').style.display = 'none';
    document.querySelector('#icon-pause').style.display = 'block';
    document.querySelector('#ptc-' + this.indexAudio).classList.add("active-track");
    this.playToPause(this.indexAudio)
    this.currentAudio.play();
  } else {
    document.querySelector('#icon-play').style.display = 'block';
    document.querySelector('#icon-pause').style.display = 'none';
    this.pauseToPlay(this.indexAudio)
    this.currentAudio.pause();
  }
}

function pauseAudio() {
  this.currentAudio.pause();
  clearInterval(interval1);
}

var timer = document.getElementsByClassName('timer')[0]

var barProgress = document.getElementById("myBar");


var width = 0;

function onTimeUpdate() {
  var t = this.currentAudio.currentTime
  timer.innerHTML = this.getMinutes(t);
  this.setBarProgress();
  if (this.currentAudio.ended) {
    document.querySelector('#icon-play').style.display = 'block';
    document.querySelector('#icon-pause').style.display = 'none';
    this.pauseToPlay(this.indexAudio)
    if (this.indexAudio < listAudio.length - 1) {
      var index = parseInt(this.indexAudio) + 1
      this.loadNewTrack(index)
    }
  }
}


function setBarProgress() {
  var progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
  document.getElementById("myBar").style.width = progress + "%";
}


function getMinutes(t) {
  var min = parseInt(parseInt(t) / 60);
  var sec = parseInt(t % 60);
  if (sec < 10) {
    sec = "0" + sec
  }
  if (min < 10) {
    min = "0" + min
  }
  return min + ":" + sec
}

var progressbar = document.querySelector('#myProgress')
progressbar.addEventListener("click", seek.bind(this));


function seek(event) {
  var percent = event.offsetX / progressbar.offsetWidth;
  this.currentAudio.currentTime = percent * this.currentAudio.duration;
  barProgress.style.width = percent * 100 + "%";
}

function forward() {
  this.currentAudio.currentTime = this.currentAudio.currentTime + 5
  this.setBarProgress();
}

function rewind() {
  this.currentAudio.currentTime = this.currentAudio.currentTime - 5
  this.setBarProgress();
}


function next() {
  if (this.indexAudio < listAudio.length - 1) {
    var oldIndex = this.indexAudio
    this.indexAudio++;
    updateStylePlaylist(oldIndex, this.indexAudio)
    this.loadNewTrack(this.indexAudio);
  }
}

function previous() {
  if (this.indexAudio > 0) {
    var oldIndex = this.indexAudio
    this.indexAudio--;
    updateStylePlaylist(oldIndex, this.indexAudio)
    this.loadNewTrack(this.indexAudio);
  }
}

function updateStylePlaylist(oldIndex, newIndex) {
  document.querySelector('#ptc-' + oldIndex).classList.remove("active-track");
  this.pauseToPlay(oldIndex);
  document.querySelector('#ptc-' + newIndex).classList.add("active-track");
  this.playToPause(newIndex)
}

function playToPause(index) {
  var ele = document.querySelector('#p-img-' + index)
  ele.classList.remove("fa-play");
  ele.classList.add("fa-pause");
}

function pauseToPlay(index) {
  var ele = document.querySelector('#p-img-' + index)
  ele.classList.remove("fa-pause");
  ele.classList.add("fa-play");
}


function normalToFav(index) {
  var ele = document.querySelector('#p-img-' + index)
  ele.classList.remove("far fa-heart");
  ele.classList.add("fas fa-heart");
}

function favToNormal(index) {
  var ele = document.querySelector('#p-img-' + index)
  ele.classList.remove("fas fa-heart");
  ele.classList.add("far fa-heart");
}

function toggleMute() {
  var btnMute = document.querySelector('#toggleMute');
  var volUp = document.querySelector('#icon-vol-up');
  var volMute = document.querySelector('#icon-vol-mute');
  if (this.currentAudio.muted == false) {
    this.currentAudio.muted = true
    volUp.style.display = "none"
    volMute.style.display = "block"
  } else {
    this.currentAudio.muted = false
    volMute.style.display = "none"
    volUp.style.display = "block"
  }
}

$("#fileI").click(function () {
  $("#file").trigger('click');
});



// when you create new musiclist , we do Id , current date and time
function currentDateTimeId() {
  var currentdate = new Date();
  var date = currentdate.getDate() + "" + (currentdate.getMonth() + 1) + "" + currentdate.getFullYear();
  var time = currentdate.getHours() + "" + currentdate.getMinutes() + "" + currentdate.getSeconds();
  return date + time;
}