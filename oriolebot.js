/*
   ----- Initialization -----
*/

// I use to read the token from the cmd line
/*if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}*/

// Dependencies 
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');
var cheerio = require('cheerio');

// Debug 
var controller = Botkit.slackbot({
    debug: true,
});

// Initilization of the bot w/ its token
var bot = controller.spawn({
    token: 'place_token_here' // process.env.token
}).startRTM();

/*
   ----- End Initialization -----
*/

// String insertion method
String.prototype.insertAt = function(index, string) { 
    if(typeof string === "undefined") 
        string = ""; // Some edge case is causing crashes
                     // This catch-all fixes it

    // Insert string, slice length Example: --- | -a-- | -a-
    var newString = this.substr(0, index) + string + this.substr(index);
    newString = newString.slice(0, newString.length - string.length);
    return newString;
}

// Sometimes the bot shuts down by itself? (Stale RTM connection?)
controller.on('rtm_close', function() {
    
    // Restart
    var bot = controller.spawn({
        token: 'place_token_here'   
    }).startRTM();
});

// When someone joins the channel
controller.on('user_channel_join', function(bot, message)
{
    var msg = ":oriolesparrot::oriolesparrot: Welcome to Birdland! :oriolesparrot::oriolesparrot:";
    bot.reply(message, msg);
});

// Load the Orioles Roster
controller.hears(['roster', 'Roster'], 'direct_message,direct_mention', function(bot, message){
    
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

            // Store some data
            var no   = []; // Number
            var name = []; // Name
            var pos  = []; // Position
            var bat  = []; // Bats
            var thw  = []; // Throws
            var age  = []; // Age
            var hgt  = []; // Height
            var wgt  = []; // Weight

            $('tr[class*=player]').each(function(i, element) {
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
                        /*
                        // Push birth place into bir
                        case 8:
                            bir.push($(this).text());
                            break;

                        // Push salary into sal
                        case 9:
                            sal.push($(this).text());
                            break;
                        */

                    } // End switch
                }); // End td
            }); // End tr

            // Initialize strings 
            var header = "No.  Name               Pos  Bat  Thw  Age  Hgt  Wgt\n";
            var data   = "";
            var roster = "";

            // For each player + relevant data...
            for(var player = 0; player < no.length; player++)
            {
               data = " ".repeat(header.length);      // Create blank string
               data = data.insertAt(0, no[player]);   // Insert number
               data = data.insertAt(5, name[player]); // Insert name
               data = data.insertAt(24, pos[player]); // Insert position
               data = data.insertAt(29, bat[player]); // Insert bat
               data = data.insertAt(34, thw[player]); // Insert throw
               data = data.insertAt(39, age[player]); // Insert age
               data = data.insertAt(44, hgt[player]); // Insert height
               data = data.insertAt(49, wgt[player]); // Insert weight
               data += "\n";
               roster += data;
               data = "";
            }

            // Execute the reply
            bot.reply(message, "```" + header + roster + "```");

        }); // End request

});


// Listener for 'help' in mention/dm
controller.hears(['help', 'Help'], 'direct_mention,direct_message', function(bot, message)
{
    // Craft help message.
    var helpMsg = "Commands \t\t Implemented? \t\t Purpose\n" +
              "Help         \t\t Yes          \t Returns the list of commands for OrioleBot.\n" +
              "Countdown    \t\t Yes          \t Returns the number of days until the O's home opener.\n" +
              "Schedule     \t\t Yes          \t Returns the schedule for the current month.\n" +
              "Roster       \t\t Yes          \t Returns the Orioles' roster.\n" +
              "Score        \t\t No           \t Returns the score of the current or last Orioles game.\n" +
              "Stats        \t\t Yes          \t Returns the Spring Training stats.";

    var result = {
                "text": "```" + helpMsg+ "```"
            }

    // Execute response
    bot.reply(message, result.text);
});

// Listener for 'schedule' in mention/direct message
controller.hears(['schedule','Schedule'], 'direct_mention,direct_message', function(bot, message) {

     bot.reply(message, "The schedule command is down for maintenance at this time.");
     return;
    
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

            // Load the html from the url
            var $ = cheerio.load(body);
            
            var dates = []; // Dates Array
            var opp   = []; // Opponents Array
            var time  = []; // Time Array
            var bp    = []; // Baltimore Pitcher Array
            var op    = []; // Opposing Pitcher Array
            var tks   = []; // Tickets Left Array
            var res   = []; // Results Array
            var wl    = []; // Win-Lose Array
            var win   = []; // Win Array
            var loss  = []; // Loss Array
            var save  = []; // Save Array
            var att   = []; // Attendance Array

            // Look at each table row that has a class 
            // containing 'team' as part of it
            $('tr[class*=team]').each(function(i, element)
            {
                var validDate  = new Date(); // Today 
                validDate.setFullYear(2001); // Set year

                /*
                // An array of each table data [data, data, data, ...]
                var thisRowsData = $(this).find('td').each(function(i, element)
                    {
                        if(i == 0) {
                            var thisDate = $(this).text();
                            if(thisDate < validDate) {}
                        }
                    });                
                */

                // The table row will have 7 or 8 
                // data cells in each row
                if(thisRowsData.length === 8)
                {

                    time.push(""); // Keep time in-line
                    bp.push("");   // Keep bp in-line
                    op.push("");   // Keep op in-line
                    tks.push("");  // Keep tks in-line

                    // For each cell in this row
                    thisRowsData.each(function(i, element)
                    {
                        // Which cell is this?
                        switch(i)
                        {
                            // Date cell
                            case 0:
                                dates.push($(this).text().trim()); // Add date if it's the current month
                                break;

                            // Opponent cell
                            case 1:
                                opp.push($(this).find('li.game-status').text().trim() + " " + $(this).find('a').text().trim());
                                break;

                            // Result cell
                            case 2:
                                res.push($(this).find('li.game-status').text().trim() + " " + $(this).find('a').text().trim());
                                break;

                            //W-L cell
                            case 3:
                                wl.push($(this).text().trim());
                                break;

                            // Win cell
                            case 4: 
                                win.push($(this).text().trim());
                                break;

                            // Loss cell
                            case 5: 
                                loss.push($(this).text().trim());
                                break;

                            // Save cell
                            case 6: 
                                save.push($(this).text().trim());
                                break;

                            // Attendance cell
                            case 7: 
                                att.push($(this).text().trim());
                                break;
                        } // End switch
                    }); // End td.each
                } // End if length === 8

                if(thisRowsData.length === 7)
                {
                    // For each cell in this row
                    thisRowsData.each(function(i, element)
                    {
                        // Which cell is this?
                        switch(i)
                        {
                            // Date cell
                            case 0:
                                // if(new Date($(this).text()).getMonth() === new Date().getMonth()) 
                                dates.push($(this).text().trim()); // Add date if it's the current month
                                break;

                            // Opponent cell
                            case 1:
                                opp.push($(this).find('li.game-status').text().trim() + " " + $(this).find('a').text().trim());
                                break;

                            // Time cell
                            case 2:
                                time.push($(this).text().trim());
                                break;

                            // TV cell
                            case 3:
                                // I don't store this data
                                break;

                            // Baltimore Pitcher cell
                            case 4: 
                                bp.push($(this).text().trim());
                                break;

                            // Opponent's Pitcher cell
                            case 5: 
                                op.push($(this).text().trim());
                                break;

                            // Tickets Left cell
                            case 6: 
                                tks.push($(this).text().trim());
                                break;
                        } // End switch
                    }); // End td.each
                } // End if tr.length === 7
            }); // End tr[class*=team] search

            // The headings, formatted
            var pHeader = "Date         Opponent          Result        W-L  Win             Loss                Save           Attendance  \n";
            var uHeader = "Date         Opponent          Time (EST)   Baltimore Pitcher     Opposing Pitcher    Tickets Left\n";
            
            // Empty strings to hold data
            var pData = "";
            var uData = "";
            var pOutput = "";
            var uOutput = "";

            // Today's date to test against
            var today = new Date();
            today.setFullYear(2001);

            for(var thisRow = 0; thisRow < dates.length; thisRow++)
            {
                // If it's a previous game
                var thisDate = new Date(dates[thisRow] + time[thisRow]);
                if(thisDate.getTime() < today.getTime())
                {
                    pData = " ".repeat(pHeader.length);         // Create a string of spaces
                    pData = pData.insertAt(0,  dates[thisRow]); // Insert this row's data
                    pData = pData.insertAt(13, opp[thisRow]);   // Insert this row's opponent
                    pData = pData.insertAt(31, res[thisRow]);   // Insert this row's result
                    pData = pData.insertAt(45, wl[thisRow]);    // Insert this row's w-l
                    pData = pData.insertAt(50, win[thisRow]);   // Insert this row's winner
                    pData = pData.insertAt(66, loss[thisRow]);  // Insert this row's loss
                    pData = pData.insertAt(86, save[thisRow]);  // Insert this row's save
                    pData = pData.insertAt(101, att[thisRow]);   // Insert this row's attendance
                    pData += "\n";
                } // End if

                // If it's an upcoming game
                else 
                {
                    uData = " ".repeat(uHeader.length);         // Create a string of spaces
                    uData = uData.insertAt(0,  dates[thisRow]); // Insert this row's data
                    uData = uData.insertAt(13, opp[thisRow]);   // Insert this row's opponent
                    uData = uData.insertAt(31, time[thisRow]);  // Insert this row's time
                    uData = uData.insertAt(44, bp[thisRow]);    // Insert this row's bp
                    uData = uData.insertAt(66, op[thisRow]);    // Insert this row's op
                    uData = uData.insertAt(86, tks[thisRow]);   // Insert this row's tickets
                    uData += "\n";
                } // End else

                pOutput += pData; // Add previous data to pOutput
                uOutput += uData; // Add upcoming data to uOutput
                pData = "";       // Clear pData
                uData = "";       // Clear uData
            } // End for

            var output = "```" + pHeader + pOutput + "\n" + uHeader + uOutput + "```";

            // Execute the reply
            bot.reply(message, output);
        });
});

controller.hears(['stats','Stats'], 'direct_mention,direct_message', function(bot, message) {
    
    // Input is the user message
    var input = message.text.toLowerCase();

    // See which stat the user specified
    var battingRequest  = input.indexOf('batting')  + 1;
    var pitchingRequest = input.indexOf('pitching') + 1;

    // If the user just said "stats" - output this message
    if(input.length < 6) {
        bot.reply(message, "Please specify one of the following stats: batting|pitching")
    }

    if(battingRequest) {

        // Get the spring training data
        var url = 'http://www.espn.com/mlb/springStats/_/team/bal';

        // Request the url & get its html
        request(url, function(error, response, body)
        {
            // Error handling on request
            if(error)
                throw error;

            // Load the html from the url
            var $ = cheerio.load(body);
        
            // Get the text location
            var data = "```" + $('div[class=mod-content]').find('pre').text() + "```";
            var data = data.replace(/�/g, '-'); // Regex to remove diacritics

            // Execute the reply
            bot.reply(message, data);
        });
    }

    // If the user wants pitching stats
    else if(pitchingRequest) {

        // Get the spring training data
        var url = 'http://www.espn.com/mlb/springStats/_/team/bal/type/pitch'
        
        // Request the url & get its html
        request(url, function(error, response, body)
        {
            // Error handling on request
            if(error)
                throw error;

            // Load the html from the url
            var $ = cheerio.load(body);
        
            // Get the text location 
            var data = "```" + $('div[class=mod-content]').find('pre').text() + "```";
            var data = data.replace(/�/g, '-'); // Regex to remove diacritics

            // Execute the reply
            bot.reply(message, data);
        });
    }
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



