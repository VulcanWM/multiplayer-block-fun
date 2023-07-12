const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
var session = require('express-session');
const { Server } = require("socket.io");
const io = new Server(server);

app.use(cookieParser());
app.use(session({secret: "SNDIRN23NE($£FO£OPRP$$RIP£$4OF34H43-F1["}));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set("view engine", "ejs");

const all_joinable_ids = []
const user_info = {}
const user_ids = {}
// user_info = {"game_id": {"username": [x_cord, y_cord]}}

app.get('/', (req, res) => {
    res.render("home", {all_ids: all_joinable_ids})
});

app.get('/host', (req, res) => {
    var game_id = (Math.floor(Math.random()*90000) + 10000).toString()
    while (all_joinable_ids.includes(game_id)){
        game_id = (Math.floor(Math.random()*90000) + 10000).toString()
    }
    all_joinable_ids.push(game_id)
    res.render("host", {game_id: game_id})
})

app.get('/join', (req, res) => {
    res.render("join_game")
})

app.post('/join', (req, res) => {
    const game_id = req.body.game_id;
    if (all_joinable_ids.includes(game_id)){
        res.redirect("/join/" + game_id)
    } else {
        res.redirect("/join")
    }
})

app.get('/join/:game_id', (req, res) => {
    const game_id = req.params.game_id
    if (all_joinable_ids.includes(game_id)){
        res.render("enter_nickname", {game_id: game_id});
    } else{
        res.redirect("/")
    }
})

app.post('/join/:game_id', (req, res) => {
    const game_id = req.params.game_id
    const nickname = req.body.nickname
    if (all_joinable_ids.includes(game_id)){
        req.session.game_id = game_id
        req.session.nickname = nickname;
        res.redirect("/play")
    } else{
        res.redirect("/")
    }
})

app.get('/play', (req, res) => {
    const game_id = req.session.game_id;
    const nickname = req.session.nickname;
    if (all_joinable_ids.includes(game_id)){
        if (nickname == undefined){
            res.redirect("/join/" + game_id)
        } else {
            res.render("play", {game_id: game_id, nickname: nickname, user_info:JSON.stringify(user_info[game_id])});
        }
    } else{
        res.redirect("/")
    }
})


io.on('connection', (socket) => {
    socket.on('user joined', (user, game_id, x_cord, y_cord) => {
        user_info[game_id][user] = [x_cord, y_cord]
        user_ids[socket.id] = {"game_id": game_id, "username": user}
        let user_id = Object.keys(user_info[game_id]).length
        io.emit('user joined', user, game_id, x_cord, y_cord, user_id);
    });
    socket.on('game generated' , (game_id) => {
        user_info[game_id] = {}
        io.emit('game generated', game_id)
    })
    socket.on('movement', (user, game_id, x_cord, y_cord) => {
        user_info[game_id][user] = [x_cord, y_cord]
        io.emit('movement', user, game_id, x_cord, y_cord)
    })
    socket.on('disconnect', function(){
        if (Object.keys(user_ids).includes(socket.id)){
            let username = user_ids[socket.id]['username'];
            let game_id = user_ids[socket.id]['game_id'];
            io.emit("user left", username, game_id);
            delete user_info[game_id][username];
            delete user_ids[socket.id];
        }
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
