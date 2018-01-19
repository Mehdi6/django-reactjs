import axios from "axios";
import { SubmissionError } from 'redux-form';
import history from "../utils/historyUtils";
import { actions as notifActions } from 'redux-notifications';
const { notifSend } = notifActions;

import { AuthTypes } from "../constants/actionTypes";
import { AuthUrls } from "../constants/urls";
import store from "../store";
import { getUserToken } from "../utils/authUtils";

export function authLogin(token) {
    return {
        type: AuthTypes.LOGIN,
        payload: token
    };
}

export function loginUser(formValues, dispatch) {
        const loginUrl = AuthUrls.LOGIN;

        return axios.post(loginUrl, formValues).then((response) => {
            // If request is good...
            // Update state to indicate user is authenticated
            //console.log(response)
            
            const token = response.data.token;
            dispatch(authLogin(token));

            localStorage.setItem("token", token);

            // redirect to the route '/'
            history.push("/");
        }).catch(error => {
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}

export function logoutUser(dispatch) {
    localStorage.removeItem("token");
    const logoutUrl = AuthUrls.LOGOUT;
    const token = getUserToken(store.getState());
    axios.get(logoutUrl, {
                headers: {
                    authorization: 'Token ' + token
                }
            }).then((response) => {
        
     console.log("logout successfully.");
    }).catch( error => {
        // print something about logout fail ...
        console.log("logout failed.");
    });
    
    return ({
            type: AuthTypes.LOGOUT
            });
}

export function signupUser(formValues, dispatch) {
    const signupUrl = AuthUrls.SIGNUP;

    return axios.post(signupUrl, formValues)
        .then((response) => {
            //console.log(response);
            // If request is good...
            // you can login if email verification is turned off.
            // const token = response.data.key;
            // dispatch(authLogin(token));
            // localStorage.setItem("token", token);

            // email need to be verified, so don't login and send user to signup_done page.
            // redirect to signup done page.
            history.push("/signup_done");
        })
        .catch((error) => {
            // If request is bad...
            // Show an error to the user
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}

function setUserProfile(payload) {
    return {
        type: AuthTypes.USER_PROFILE,
        payload: payload
    };
}

export function getUserProfile() {
    return function(dispatch) {
        const token = getUserToken(store.getState());
        if (token) {
            axios.get(AuthUrls.USER_PROFILE, {
                headers: {
                    authorization: 'Token ' + token
                }
            }).then(response => {
                dispatch(setUserProfile(response.data))
            }).catch((error) => {
                // If request is bad...
                // Show an error to the user
                //console.log(error);
                // TODO: send notification and redirect
            });
        }
    };
}

export function changePassword(formValues, dispatch) {
    const changePasswordUrl = AuthUrls.CHANGE_PASSWORD;
    const token = getUserToken(store.getState());

    if (token) {
        return axios.post(changePasswordUrl, formValues, {
            headers: {
                authorization: 'Token ' + token
            }
        })
            .then(() => {
                dispatch(notifSend({
                    message: "Password has been changed successfully",
                    kind: "info",
                    dismissAfter: 5000
                }));
                // redirect to the route '/profile'
                history.push("/profile");
            })
            .catch((error) => {
                // If request is bad...
                // Show an error to the user
                const processedError = processServerError(error.response.data);
                throw new SubmissionError(processedError);
            });
    }
}

export function resetPassword(formValues, dispatch) {
    const resetPasswordUrl = AuthUrls.RESET_PASSWORD;

    return axios.post(resetPasswordUrl, formValues)
        .then(response => {
            // redirect to reset done page
            history.push("/reset_password_done");
        }).catch((error) => {
            // If request is bad...
            // Show an error to the user
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}

export function confirmPasswordChange(formValues, dispatch, props) {
    const { token } = props.match.params;
    const resetPasswordConfirmUrl = AuthUrls.RESET_PASSWORD_CONFIRM;
    const data = Object.assign(formValues, { token });

    return axios.post(resetPasswordConfirmUrl, data)
        .then(() => {
            dispatch(notifSend({
                message: "Password has been reset successfully, please log in",
                kind: "info",
                dismissAfter: 5000
            }));

            history.push("/login");
        }).catch((error) => {
            // If request is bad...
            // Show an error to the user
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}

export function activateUserAccount(formValues, dispatch, props) {
    const { key } = props.match.params;
    const activateUserUrl = AuthUrls.USER_ACTIVATION;
    const data = Object.assign(formValues, { key });

    return axios.get(activateUserUrl, {
                params:{
                token: data["key"]
                }
        }).then(() => {
            dispatch(notifSend({
                message: "Your account has been activated successfully, please log in",
                kind: "info",
                dismissAfter: 5000
            }));

            history.push("/login");
        }).catch((error) => {
            // If request is bad...
            // Show an error to the user
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}

export function updateUserProfile(formValues, dispatch) {
    const token = getUserToken(store.getState());
    //console.log("balbla")
    //console.log(token)
    return axios.patch(AuthUrls.USER_PROFILE, formValues, {
        headers: {
            authorization: 'Token ' + token
        }
    })
        .then(() => {
            dispatch(notifSend({
                message: "Your profile has been updated successfully",
                kind: "info",
                dismissAfter: 5000
            }));

            history.push("/profile");
        }).catch((error) => {
            // If request is bad...
            // Show an error to the user
            const processedError = processServerError(error.response.data);
            throw new SubmissionError(processedError);
        });
}
// util functions
function processServerError(error) {
    return  Object.keys(error).reduce(function(newDict, key) {
        if (key === "non_field_errors") {
            newDict["_error"].push(error[key]);
        } else if (key === "token") {
            // token sent with request is invalid
            newDict["_error"].push("The link is not valid any more.");
        } else {
            newDict[key] = error[key];
        }

        return newDict
    }, {"_error": []});
}