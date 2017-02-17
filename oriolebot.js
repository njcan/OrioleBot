/*
# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:
    set token=<token>
    node slack_bot.js
*/

/*
   ----- Initialization -----
*/
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');
var cheerio = require('cheerio');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token,
}).startRTM();
/*
   ----- End Initialization -----
*/

// Created own string insertion method :D
String.prototype.insertAt = function(index, string) { 
  return this.substr(0, index) + string + this.substr(index);
}

// Sometimes the bot shuts down by itself? (Stale RTM connection?)
controller.on('rtm_close', function() {
    
    // Restart
    var bot = controller.spawn({
        token: process.env.token,   
    }).startRTM();
});

// When someone joins the channel
controller.on('user_channel_join', function(bot, message)
{
    var msg = ":oriolesparrot::oriolesparrot: Welcome to Birdland! :oriolesparrot::oriolesparrot:";
    bot.reply(message, msg);
});


controller.hears(['roster', 'Roster'], 'direct_message, direct_mention', function(bot, message){
    
    // URL to scrape
    var url = 'http://www.espn.com/mlb/team/roster/_/name/bal/baltimore-orioles';

    // Request the url & get its html
    request(url, function(error, response, body)
        {
            // Error handling on request
            if(error)
                throw error;

            // Load the html from the url
            var $ = cheerio.load(body);

            var no   = [];
            var name = [];
            var pos  = [];
            var bat  = [];
            var thw  = [];
            var age  = [];
            var hgt  = [];
            var wgt  = [];

            // Get oddrows
            $('tr.oddrow').each(function()
            {
                $(this).find('td').each(function(i, element) {
                    switch(i) {

                        // Push number into no
                        case 0:
                            no.push($(this).text());
                            break;

                        // Push name into name
                        case 1:
                            name.push($(this).text());
                            break;

                        // Push position into pos
                        case 2:
                            pos.push($(this).text());
                            break;

                        // Push bats into bat
                        case 3:
                            bat.push($(this).text());
                            break;

                        // Push throws into thw
                        case 4:
                            thw.push($(this).text());
                            break;

                        // Push age into age
                        case 5:
                            age.push($(this).text());
                            break;

                        // Push height into hgt
                        case 6:
                            hgt.push($(this).text());
                            break;

                        // Push weight into wgt
                        case 7:
                            wgt.push($(this).text());
                            break;

                    }

                    
                });  
            }); // End oddrow search

            // Get the game status
            $('tr.evenrow').each(function()
            {
                $(this).find('td').each(function(i, element) {
                    switch(i) {

                        // Push number into no
                        case 0:
                            no.push($(this).text());
                            break;

                        // Push name into name
                        case 1:
                            name.push($(this).text());
                            break;

                        // Push position into pos
                        case 2:
                            pos.push($(this).text());
                            break;

                        // Push bats into bat
                        case 3:
                            bat.push($(this).text());
                            break;

                        // Push throws into thw
                        case 4:
                            thw.push($(this).text());
                            break;

                        // Push age into age
                        case 5:
                            age.push($(this).text());
                            break;

                        // Push height into hgt
                        case 6:
                            hgt.push($(this).text());
                            break;

                        // Push weight into wgt
                        case 7:
                            wgt.push($(this).text());
                            break;

                    }

                    
                });  
            }); // End evenrow search

            // Heading for output
            var header = "No.      Name                  Pos  Bat Thw  Age  Hgt  Wgt\n";
            var line = "-".repeat(header.length-1);
            var data = "";
            for(var item = 0; item < no.length; item++)
            {
                line = line.insertAt(0, no[item]);
                line = line.insertAt(9, name[item]);
                line = line.insertAt(31, pos[item]);
                line = line.insertAt(37, bat[item]);
                line = line.insertAt(41, thw[item]);
                line = line.insertAt(45, age[item]);
                line = line.insertAt(50, hgt[item]);
                line = line.insertAt(55, wgt[item]);
                if(item != no.length-1)
                    line = line + "\n";
                data = data + line;
                line = "";
                line = "-".repeat(header.length-1);

            }

            


            

            // Format the message as a code-block in Slack
            var result = {
                "text": "```" + header + data + "```"
            }

            // Execute the reply
            bot.reply(message, result.text);

        }); // End request

});


// Listener for 'help' in mention/dm
controller.hears(['help', 'Help'], 'direct_mention,direct_message', function(bot, message)
{
    // Craft help message.
    var helpMsg = "Commands \t\t Implemented? \t\t Purpose\n" +
              "Help         \t\t Yes          \t Returns the list of commands for OrioleBot.\n" +
              "Countdown    \t\t Yes          \t Returns the number of days until the O's home opener.\n" +
              "Roster       \t\t No           \t Returns the Orioles' 40-man roster.\n" +
              "Score        \t\t No           \t Returns the score of the current or last Orioles game.\n" +
              "Stats        \t\t No           \t Returns the stats of the requested player.";

    var result = {
                "text": "```" + helpMsg+ "```"
            }

    // Execute response
    bot.reply(message, result.text);
});





// Listener for 'schedule' in mention/direct message
controller.hears(['schedule','Schedule'], 'direct_mention,direct_message', function(bot, message) {
    
    // URL to scrape
    var url = '';
    var month = new Date().getMonth();

    // Spring training is on this URL
    if(month === 1 || month === 2)
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal/seasontype/1';
    } 

    // First half of the season is on this URL
    if(month === 3 || month === 4 || month === 5 || month === 6) 
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal'
    }

    // Second half of the season is on this URL
    if(month === 6 || month === 7 || month === 8 || month === 9)
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal/half/2'
    }
    
    // Request the url & get its html
    request(url, function(error, response, body)
        {
            // Error handling on request
            if(error)
                throw error;

            // The heading string, formatted
            var output = "Date\t\t\t\t\tOpponent\t\t\t\t\tTime (EST)\t\t\t\t\tBaltimore Pitcher\t\t\t\t\tOpposing Pitcher\n";
            
            // Load the html from the url
            var $ = cheerio.load(body);
            
            var dates = []; // Dates Array
            var gs    = []; // Game Status
            var opp   = []; // Opponents Array
            var time  = []; // Time Array
            var bp    = []; // Baltimore Pitcher Array
            var op    = []; // Opposing Pitcher Array

            // Get all of the dates
            $('nobr').each(function(i, element)
            { 
                // Get all dates for the current month
                if(new Date($(this).text()).getMonth() === month)
                {
                    dates.push($(this).text());
                }
            });

            // Get the game status
            $('li.game-status').each(function(i, element)
            {
                gs.push($(this).text());
            });

            // Get the opponents
            $('li.team-name').each(function(i, element)
            {
                opp.push($(this).text());
            });

            // Get the time of each game
            $('td[align="right"]').each(function(i, element)
            {
                if(i > 0) // Skip header
                    time.push($(this).text());
            });

            // Generate a blank string that we can insert data into
            var data = " ".repeat(output.length+30 * dates.length);

            // Put it altogether 
            for(var i = 0; i < dates.length; i++)
            {
                data = data.insertAt(i*output.length, dates[i]);
                data = data.insertAt(i*output.length+24, gs[i] + " " + opp[i]);
                data = data.insertAt(i*output.length+53, time[i]);
                data = data.insertAt((i+1)*output.length-1, "\n");
            }

            // Format the message as a code-block in Slack
            var result = {
                "text": "```" + output + data + "```"
            }

            // Execute the reply
            bot.reply(message, result.text);
        });
});




// Countdown listener
controller.hears(['countdown','Countdown'], 'direct_mention,direct_message', function(bot, message) {
    
    // Date of Os home opener, what time it is now, the difference
    var openingDay = new Date("April 3, 2017 15:05:00").getTime();
    var now = new Date().getTime();
    var timeLeft = openingDay - now;

    // Conversion to days/hours/mins/secs
    var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Return the string of data
    var cd = ":oriolesparrot::oriolesparrot: " + days + " days " + hours + " hours " + minutes + " minutes and " + seconds + " seconds until the O's home opener! :oriolesparrot::oriolesparrot:";

    // Execute the reply
    bot.reply(message, cd);
});




