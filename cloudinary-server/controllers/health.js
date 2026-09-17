const checkHealth = (req, res) => {
    return res.status(200).json({
        message: "I'm fine"
    })
}

module.exports = { checkHealth }