app.service("configService",['$http', function ($http) {
	var data = [];
	
	var set = function(rubrique, clef, valeur) {
		if(angular.isUndefined(data[rubrique])) data[rubrique] = [];
		data[rubrique][clef] = valeur;
	};
	
	var parse = function(data){
		angular.forEach(data, function(items, rubrique) {
			angular.forEach(items, function(valeur, clef) {
				/* en gros la config fonctionne sous le syst�me Rubrique > Clef > Valeur */
				
				set(rubrique, clef, valeur);
				
			});
		});
	};
	
	return {
		get :function(rubrique, clef) {
			if(angular.isUndefined(data[rubrique])) return false;
			if(angular.isUndefined(data[rubrique][clef])) return false;		//TO DO : tester toutes les valeurs face � false, et si false d�finir une valeur par d�faut. Au moins pour celles o� �a importe bcp	 
			return data[rubrique][clef];
		},		
				
		load :function(url) {
			$http.get(url)
			.success(function(data) {
				parse(data);				
			})
			.error(function(data,status,error,config){		
			   alert("impossible de charger la configuration, erreur critique");
			});
		}
	};
}]);
