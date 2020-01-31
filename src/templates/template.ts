export const userRegister = `<html>
Hello <%= firstName%>,</br></br>

Greetings of the day!</br>
You are successfully registered.</br>
Thank you for joining FairwayCafe.</br></br>


Thanks & regards,</br>
Fairwaycafe Team
</html>`


export const newOrderForAdmin = `<html>
Hello <%= firstName%>,</br></br>

Greetings of the day!</br>
You got a new order, bellow are the order details.</br></br>

<%=data%> </br></br>


Thanks & regards,</br>
Fairwaycafe Team
</html>`

export const newOrderForUser = `<html>
Hello <%= firstName%>,</br></br>

Greetings of the day!</br>
You order placed succesfully, bellow are the order details.</br></br>

<%=data%> </br></br>


Thanks & regards,</br>
Fairwaycafe Team
</html>`

export const changeOrderStatus = `<html>
Hello <%= firstName%>,</br></br>

Greetings of the day!</br>
Your order status is changed to <b><%= status%></b> now.</br></br>

Thanks & regards,</br>
Fairwaycafe Team
</html>`


export const adminForgotPassword = `<html>
Hello <%= firstName%>,</br></br>

Greetings of the day!</br>
Your password has been reseted.</br>
Please login using this password: <b><%= password%></b>.</br></br>

Thanks & regards,</br>
Fairwaycafe Team
</html>`

