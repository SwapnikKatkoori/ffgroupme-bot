const puppeteer = require('puppeteer')

class Api{

	constructor(email, password, leagueId, seasonId){
		this.email = email
		this.password = password
		this.leagueId = leagueId
		this.seasonId = seasonId
		this.browser = puppeteer.launch({headless:false});
	}

	async goToNewPage(url){
		const browser = await this.browser;
		const page = await browser.newPage();
		await page.goto(url);
		return page;
	}

	async login(){
		const browser = await this.browser;
		const page = await browser.newPage();

		await page.goto('http://www.espn.com/login')
		await page.waitForSelector("iframe");

		const elementHandle = await page.$('div#disneyid-wrapper iframe');
		const frame = await elementHandle.contentFrame();

		await frame.waitForSelector('[ng-model="vm.username"]', {visible: true})
		const username = await frame.$('[ng-model="vm.username"]');
		await username.type(this.email);

		await frame.waitForSelector('[ng-model="vm.password"]', {visible: true})
		const password = await frame.$('[ng-model="vm.password"]');
		await password.type(this.password);

		await frame.waitForSelector('[aria-label="Log In"]', {visible: true})
		const loginButton = await frame.$('[aria-label="Log In"]');
		await loginButton.click();
		return
	}


	async getStandings(){
		const page = await this.goToNewPage(`http://fantasy.espn.com/football/league/standings?leagueId=${this.leagueId}&seasonId=${this.seasonId}`);

		/*
		-selects the standings table and gets the standings as a list of strings.
		*/
		await page.waitForSelector(".Table2__tbody");
		var table = null
		const list_of_names = await page.evaluate(()=>{
			list_of_names = []
			table = document.getElementsByClassName('Table2__tbody');
			for(var i = 0; i<table[0].children.length; i++){
				list_of_names.push(table[0].children[i].textContent);
			}
			return list_of_names;
		})


		/*
		-Cleans the list of names and makes then readable
		-Makes a map of the standings
		-Makes a list of strings of the standings
		-The format was changed for the 2019 season and might change again
		*/
		standings_list = [];
		standings_map = new Map();
		var count = 1
		for(name of list_of_names){
			const index = name.indexOf('.');
			if (count >= 10){
				var rank = name.slice(0,2);
				var team_name = name.slice(2,index-3);

				if (isNaN(rank)){
					rank = name.slice(0,1);
					team_name = name.slice(1,index-3);
				}
				const rank_number = Number(rank);
				
				standings_list.push(rank+ " " + team_name); //1example team
				if (standings_map.has(rank_number)){
					standings_map.get(rank_number).push(rank+ " " + team_name);
				}else{
					standings_map.set(rank_number, []);
				}
			}
			else{
				const rank = name.slice(0,1);
				const rank_number = Number(rank);
				const team_name = name.slice(1,index-3)
				standings_list.push(rank + " " + team_name);
				if (standings_map.has(rank_number)){
					standings_map.get(rank_number).push(rank+ " " + team_name);
				}else{
					standings_map.set(rank_number, []);
				}
			}

			count += 1;

		}

		standings = {
			standings_list: standings_list,
			standings_map: standings_map
		}
		return standings
	}

	/*
	-Scrapes the espn score board page to get head to head scores.
	-Returns an object of the format:
		{
			1:  {
					homeTeam:
					{
						teamName: {},
						score: {}
					},
					awayTeam:{
						teamName: {},
						score: {}
					}
				}
			2:  ...
		}
	*/
	async getScores(){
		page = await this.goToNewPage(`http://fantasy.espn.com/football/league/scoreboard?leagueId=${this.leagueId}&seasonId=${this.seasonId}`);


	}

	async closeBrowser(){
		const browser = await this.browser;
		browser.close();
	}
}
module.exports = Api;