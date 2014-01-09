/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function getDummyWeight(now)
{
    function getDay(day,now){
        var d = new Date(now);
        d.setFullYear(d.getFullYear()-1);
        d.setDate(day);
        return d.getTime();
    };
    
    var data = [];
    for(var i=0; i<365; ++i){
        var weight = Math.floor(Math.random()*140) + 20;
        data[i] = [ getDay(i,now), weight ];
    }
    return data;
}

function getDummyFat(now)
{
    function getDay(day,now){
        var d = new Date(now);
        d.setFullYear(d.getFullYear()-1);
        d.setDate(day);
        return d.getTime();
    };
    
    var data = [];
    for(var i=0; i<365; ++i){
        var weight = Math.floor(Math.random()*1000) / 10;
        data[i] = [ getDay(i,now), weight ];
    }
    return data;
}

function getDummyCalorie(now)
{
    var days = [];
    var currentDay = new Date(now);
    currentDay.setFullYear( currentDay.getFullYear()-1 );
    for(var i =0; i < 365; ++i){
        days.push(new Date(currentDay));
        currentDay.setDate( currentDay.getDate() + 1);
    }

    var color = 'pink';
    var data = [];
    for(var i=0; i<365; i++){
        var weight = Math.floor(Math.random()*90000) / 10;
        data.push({ color : color, x : days[i], y : weight});
    }
    
    
    
    return data;
}


function getMinMaxAvg(datas)
{
    var result = {};

    var min = Number.MAX_VALUE;
    var max = 0;
    var avg = 0;
    
    var len = datas.length;
    for(var i = 0; i < len; ++i){
        var data = datas[i][1];
        min = Math.min(min, data);
        max = Math.max(max, data);
        avg += data;
    }
    avg = avg / len;
    avg = avg.toFixed(1);
    
    return {
        'min' : min,
        'max' : max,
        'avg' : avg        
    };    
}