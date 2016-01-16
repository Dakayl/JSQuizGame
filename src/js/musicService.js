app.service("musicService",['$http', function ($http) {

var path_normal = "";
var list_normal = [];
var path_hard = "";
var list_hard = [];
var current = "normal";
var callback = null;


var play = function(url,type, volume){
		$("#m_player").stop();
		var str = $('<source src="'+url+'" type="'+type+'" />');
		$("#m_player source").remove();
		$("#m_player").append(str);
		$("#m_player").trigger('load'); //Sinon il garde l'ancien
		$("#m_player").prop("volume", volume); //Permet une gestion par musique du son.
		$("#m_player").trigger('play');
		
};
var parse = function(datas) {
	path_normal = datas.normal.path;
	list_normal = datas.normal.list;	
	path_hard = datas.hard.path;		
	list_hard = datas.hard.list;
};

var normal = function(){
	
	if(list_normal.length < 1) return; // Sécurité si pas de musique
	
	$("#m_player").unbind("ended");
	var number = Math.floor(Math.random()*list_normal.length);
	var item = list_normal[number];
	
	/*Lancement des musiques "mode normal" et boucle */
	play(path_normal+item.url, item.type, item.volume);	
	$("#m_player").bind("ended", normal);
	var name = item.url.replace(".ogg","").replace(".mp3","");
	if(callback != null) callback(name); //Affichage du nom
};

var hard = function() {
	if(list_hard.length < 1) return;
	$("#m_player").unbind("ended");
	var number = Math.floor(Math.random()*list_hard.length);
	var item = list_hard[number];
	
	/*Lancement des musiques "mode hard" et boucle */
	play(path_hard+item.url, item.type, item.volume);
	$("#m_player").bind("ended", hard);
	var name = item.url.replace(".ogg","").replace(".mp3","");
	if(callback != null) callback(name);
};

return {
		play_normal:function() {
			return normal();
		},
		play_hard:function(){
			return hard();
		},
		load :function(url) {
			$http.get(url)
			.success(function(data) {
				parse(data);				
			})
			.error(function(data,status,error,config){		
				alert("impossible de charger la musique, erreur critique"); // Généralement synonyme de json mal formaté.
			});
		},
		pause:function(){
			$("#m_player").trigger('pause');
		},
		stop:function(){
			$("#m_player").trigger('pause'); //Trigger stop ne semble pas marcher
			$("#m_player").prop("currentTime",0);
		},
		restore:function(){
			$("#m_player").trigger('play');
		},
		setCallback:function(f){
			callback = f;
		}
	}
}]);
