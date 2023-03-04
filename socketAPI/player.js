const Player = function () {
    // VARIABLES
    let PlayerId
    let PlayerSocketId
    let PlayerName
    let PlayerPoints = 0
    let PlayerHealth
    let PlayerDamage

    this.getPlayerId = () => { return PlayerId }
    this.getPlayerSocketId = () => { return PlayerSocketId }
    this.getPlayerName = () => { return PlayerName }
    this.getPlayerPoints = () => { return PlayerPoints }
    this.getPlayerHealth = () => { return PlayerHealth }
    this.getPlayerDamage = () => { return PlayerDamage }

    this.setPlayerId = (_playerId) => { PlayerId = _playerId }
    this.setPlayerSocketId = (_playerSocketId) => { PlayerSocketId = _playerSocketId }
    this.setPlayerName = (_playerName) => { PlayerName = _playerName }
    this.setPlayerPoints = (_points) => { PlayerPoints = PlayerPoints + _points }
    this.setPlayerHealth = (_playerHealth) => { PlayerHealth = _playerHealth }
    this.setPlayerDamage = (_playerDamage) => { PlayerDamage = _playerDamage }
}

module.exports = Player;