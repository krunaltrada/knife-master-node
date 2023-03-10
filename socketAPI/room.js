var _ = require('lodash');
const Room = function (io) {
    let roomId
    let roomCreatorSocketId

    let roomFull = false
    let gameStart = false

    let app = require('../app');
    let Player = require('./player');

    let playerObjectList = [];
    let playerData = [];

    this.getRoomFull = () => { return roomFull }
    this.getGameStart = () => { return gameStart }
    this.getRoomId = () => { return roomId }
    this.getRoomCreatorSocketId = () => { return roomCreatorSocketId }
    this.getPlayerObjectList = () => { return playerObjectList }

    this.setRoomId = (_roomId) => { roomId = _roomId }
    this.setRoomCreatorSocketId = (_roomCreatorSocketId) => { roomCreatorSocketId = _roomCreatorSocketId }

    this.connectPlayer = (socket, _playerName, _playerHealth, _playerDamage) => {
        let findPlayerSocketId = _.find(playerObjectList, _player => _player.getPlayerSocketId() == socket.id)
        let playerId = Date.now().toString();
        if (!findPlayerSocketId) {
            let socketId = socket.id;
            let newPlayer = new Player();
            newPlayer.setPlayerId(playerId);
            newPlayer.setPlayerSocketId(socketId);
            newPlayer.setPlayerName(_playerName);
            newPlayer.setPlayerHealth(_playerHealth);
            newPlayer.setPlayerDamage(_playerDamage);
            playerObjectList.push(newPlayer);
            if (playerObjectList.length == 2) {
                roomFull = true
                gameStart = true
                console.log('----room full status ---- : ', roomFull);
            } else {
                roomFull = false
                gameStart = false
                console.log('----room full status ---- : ', roomFull);
            }
            console.log('TotalPlayers :', playerObjectList.length);
            playerData.push({ socketId: socket.id, playerId: playerId, playerName: _playerName, playerHealth: _playerHealth, playerDamage: _playerDamage });
            console.log({ roomId, playerData: playerData });
            if (playerObjectList.length == 2) {
                // io.in(roomId).emit('newGameAction', JSON.stringify({ roomId, playerData: playerData }));
                socket.to(playerData[0].socketId).emit('onOpponentFound', JSON.stringify({
                    playerName: playerData[1].playerName,
                    playerHealth: playerData[1].playerHealth,
                    playerDamage: playerData[1].playerDamage
                }))
                socket.emit('onOpponentFound', JSON.stringify({
                    playerName: playerData[0].playerName,
                    playerHealth: playerData[0].playerHealth,
                    playerDamage: playerData[0].playerDamage
                }))
                // io.in(roomId).emit('newGameAction', JSON.stringify({
                //     playerId: playerData[1] ? playerData[0].playerId : null,
                //     opponentId: playerData[0] ? playerData[1].playerId : null,
                // }));
                socket.to(playerData[0].socketId).emit('newGameAction', JSON.stringify({
                    playerId: playerData[0] ? playerData[0].playerId : null,
                    opponentId: playerData[1] ? playerData[1].playerId : null,
                }))
                socket.emit('newGameAction', JSON.stringify({
                    playerId: playerData[1] ? playerData[1].playerId : null,
                    opponentId: playerData[0] ? playerData[0].playerId : null,
                }))
            }
        } else {
            io.to(findPlayerSocketId.getPlayerSocketId()).emit('playerInRoomAction', JSON.stringify({ status: false, message: 'Already In Room!!' }));
        }

        socket.on('disconnect', (reason) => {
            console.log(socket.id, '------ disconnect socket id ------', reason);
            let findPlayerInObjList = _.find(playerObjectList, _player => _player.getPlayerSocketId() == socket.id);

            let findPlayerData;
            if (findPlayerInObjList) {
                findPlayerData = _.find(playerData, _player => _player.playerId == findPlayerInObjList.getPlayerId());
            }

            disconnectFunc(findPlayerInObjList, findPlayerData);
        });

        socket.on('disconnectManually', (_playerData) => {
            console.log(socket.id, '------ disconnect manually ------');
            const { playerId } = JSON.parse(_playerData);
            let findPlayerInObjList = _.find(playerObjectList, _player => _player.getPlayerId() == playerId);
            let findPlayerData = _.find(playerData, _player => _player.playerId == playerId);

            disconnectFunc(findPlayerInObjList, findPlayerData);
        });

        socket.on('onPlayerMove', (_playerData) => {
            let { playerId, attackType } = JSON.parse(_playerData);
            let opponentPlayer = _.find(playerData, _player => _player.playerId != playerId);
            if (opponentPlayer) {
                socket.to(opponentPlayer.socketId).emit('onPlayerMoveAction', JSON.stringify({ playerId, attackType }));
            }
        });

        socket.on("playerLose", (_playerData) => {
            let { playerId } = JSON.parse(_playerData);
            let opponentPlayer = _.find(playerData, _player => _player.playerId != playerId);
            socket.to(opponentPlayer.getPlayerSocketId()).emit('playerWinAction', JSON.stringify({ message: "You Win." }));
        });
    }

    const disconnectFunc = (findPlayerInObjList, findPlayerData) => {
        playerObjectList.splice(playerObjectList.indexOf(findPlayerInObjList), 1);
        playerData.splice(playerData.indexOf(findPlayerData), 1);
        if (playerObjectList.length == 2) { roomFull = true } else { roomFull = false }
        if (findPlayerInObjList) {
            io.in(roomId).emit('disconnectAction', JSON.stringify({ status: false, playerId: findPlayerInObjList.getPlayerId(), playerName: findPlayerInObjList.getPlayerName() }));
        }
        if (playerObjectList.length == 0) { deleteRoom() }
    }

    const deleteRoom = () => {
        const roomObjectList = app.roomObjectList;
        let findRoom = _.find(roomObjectList, _room => _room.getRoomId() == roomId);
        if (findRoom) { roomObjectList.splice(roomObjectList.indexOf(findRoom), 1) }
        console.log("After Disconnect Total Rooms : ", roomObjectList.length);
    }
}

module.exports = Room;
