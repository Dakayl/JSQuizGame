app.controller('gameController', ['$route','$location','$interval','$http','$scope','plService','soundService', 'quizService','configService','musicService'
,function($route, $location, $interval, $http, $scope, plService,soundService,quizService,configService,musicService) {
 
	$("body").removeClass("finish");

	$scope.playername = plService.getName();
	$scope.score = 0;
	$scope.numeroQuestion = 0;
	$scope.nbQuestions = "...";
	$scope.currentQuestion = null;	
	$scope.currentScore;
	$scope.theme = "";
	$scope.highlighted = null;
	$scope.musictext = null;	
	
	var jouer_intro = configService.get('intro','jouer');	
	var url_musique_intro = configService.get('intro','musique');
	if(jouer_intro) {
		soundService.setIntro(url_musique_intro);		
	}
	var timer_intro = configService.get('intro','timer_avant_jeu');
	var dieOnErrors = configService.get('finish','mort_si_erreur');
	var dieOnTimeOut = configService.get('timer','mort_si_zero');
	var timerDelay = configService.get('timer','millisecondes_intervalle');
	var maxScore = configService.get('timer','duree');
	var delay = configService.get('finish','duree_avant_suite');
	var faire_noyade =  configService.get('timer','lancer_noyage');
	var timer_noyade =  configService.get('timer','timer_noyade');
	var startHardQuestion =  configService.get('mode_hard','startQuestion');
	var nbReponsesNormal =  configService.get('mode_hard','nbReponsesNormal');
	var nbReponsesHard =  configService.get('mode_hard','nbReponsesHard');
	var storedIdQuestion =  null;
	$scope.hardLabel =  configService.get('mode_hard','label');
	$scope.showHardMode = false;
	
	var buttons_start = configService.get('bouttons','Start');
	
	var buttons_one = configService.get('bouttons','Reponse1');
	var buttons_two = configService.get('bouttons','Reponse2');
	var buttons_three = configService.get('bouttons','Reponse3');
	var buttons_four = configService.get('bouttons','Reponse4');
	var difficulties = []; //Tri par ordre de difficult�
	var lastAnsweredQuestion = 0;
	var chrono;
	
	// tri par valeur de clef
	var keysort = function(key,desc) {
	  return function(a,b){
	   return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
	  }
	}
	
	var startMusic = function(){
		musicService.setCallback(refreshMusicText);
		musicService.play_normal();
	}
	
	var goStart = function(){
		$("body").bind("keypress",function(e) { MyKeyPress(e.keyCode || e.which)});
		lastAnsweredQuestion = 0;
		getQuestion();
		$interval(startMusic, 1, 1);
	}
		
	soundService.intro();
	var url = quizService.getFullPath();
	
	$http.get(url)
	.success(function(data) {		
		$scope.theme = data.theme;
		difficulties  = data.questions.sort(keysort('difficulty',true)); //Note : Tri d�croissant
		$scope.nbQuestions = difficulties.length;		
		plService.setScore(0);
		plService.setAnswers(0);
		
	})
	.error(function(data,status,error,config){
	   $scope.categories=[];
	   $scope.currentCat = null;
	   $scope.error = "Impossible de charger le quiz";
	});
	$interval(goStart, timer_intro, 1);
	
	var warningHardMode = function(){
		musicService.stop();
		$scope.showHardMode = true;
		$("body").addClass("hard");
		$interval(doNextQuestion, 6000, 1);
		soundService.hardmode();
		$interval(playHard, 5990, 1);
	};
	
	var playHard = function(){
		musicService.play_hard();
	}
	
	var getQuestion = function(){
		$interval.cancel(chrono);
		$scope.numeroQuestion++;
		$scope.highlighted = null;
		if(startHardQuestion == $scope.numeroQuestion) {
			warningHardMode();
		}
		else doNextQuestion();	
	}
	
	var doNextQuestion = function(){
		$scope.showHardMode = false;
		$scope.currentQuestion = difficulties.pop();
		
		if($scope.currentQuestion == null) {
			$interval(goWin, 1, 1);
		}
		else {
			$scope.currentScore = maxScore;

			chrono = $interval(decreaseCurrentScore, timerDelay);
		}
	}
	
	var decreaseCurrentScore = function(){
		
		if($scope.currentScore == 0) {
			$interval.cancel(chrono);
			if(dieOnTimeOut) $interval(goLoose, delay, 1);
		}
		else {
			$scope.currentScore--;
			if(faire_noyade && $scope.currentScore == timer_noyade) {
				soundService.drowning();
				musicService.pause();
			}
		}
	}
	
	var refreshMusicText = function(txt){
		$scope.musictext = txt;
	}
	
	$scope.highlight = function(idQuestion, index){
		$("#question .reponseQuiz").removeClass("highlight");
		soundService.click();
		$("#reponse-"+idQuestion+"-"+index).addClass("highlight");
		$scope.highlighted = index;
	}
	
	var highlightByIndex = function(index){
		alert(index);
		$scope.highlight($scope.currentQuestion.id, index);

	}
	
	
	$scope.answering = function(idQuestion, index, w){
		soundService.stopall();
		if(lastAnsweredQuestion == idQuestion) return;
		lastAnsweredQuestion = idQuestion;
		$interval.cancel(chrono);
		$("#reponse-"+idQuestion+"-"+index).removeClass("highlight");
		if(w == 5) {
			soundService.win();
			$scope.score += $scope.currentScore;
			$("#reponse-"+idQuestion+"-"+index).addClass("green");
			$interval(getQuestion, delay, 1);
			musicService.restore();
		} else {
			soundService.loose();			
			$scope.score -= $scope.currentScore;			
			$("#reponse-"+idQuestion+"-"+index).addClass("red");
			if(dieOnErrors) $interval(goLoose, delay, 1);
			else $interval(getQuestion, delay, 1);
		}
		$scope.highlighted = null;		
	}
	
	var confirmByKeyboard = function(){	
		var index = $scope.highlighted;
	    if(index == null) return;
		var w = $scope.currentQuestion.answers[index].weight;
		$scope.answering($scope.currentQuestion.id, index , w);
	}
	
	var MyKeyPress = function(intkey){

		var str = String.fromCharCode(intkey).toUpperCase();
		if($.inArray( str, buttons_one ) > -1){
			return highlightByIndex(0);
		}
		if($.inArray( str, buttons_two ) > -1){
			return highlightByIndex(1);
		}
		if($.inArray( str, buttons_three ) > -1){
			return highlightByIndex(2);
		}
		if($.inArray( str, buttons_four ) > -1){
			return highlightByIndex(3);
		}
		if($.inArray( str, buttons_start ) > -1){
			return confirmByKeyboard();
		}

	}
	
	
	var goLoose = function(){
		$("body").unbind("keypress");
		$interval.cancel(chrono);
		musicService.stop();
		plService.setScore($scope.score);
		plService.setAnswers($scope.numeroQuestion);
		$location.path("/loose"); 
	}
		
	var goWin = function() {
		$("body").unbind("keypress");
		$interval.cancel(chrono);
		musicService.stop();
		plService.setScore($scope.score);
		plService.setAnswers($scope.numeroQuestion);
		$location.path("/win"); 
	}
	
}]);