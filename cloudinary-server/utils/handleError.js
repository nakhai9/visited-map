const Response = ({ success, message, data, code }) => {
    return {
        success,
        code,
        data,
        message
    }
}

module.exports = Response