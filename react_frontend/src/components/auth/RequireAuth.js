import React, { Component } from "react";
import PropTypes from "prop-types";
import {withRouter} from "react-router-dom";
import { connect } from "react-redux";

export default function(ComposedComponent, moreProps=null) {
    class Authentication extends Component {

        static propTypes = {
            history: PropTypes.object
        };

        componentWillMount() {
            this.checkAuthentication(this.props);

        }

        componentWillUpdate(nextProps) {
            this.checkAuthentication(nextProps);
        }

        checkAuthentication(props) {
            if (!props.authenticated) {
                this.props.history.push("/login");
            }
        }

        render() {
            return <ComposedComponent {...Object.assign({} ,...this.props, moreProps)} />
        }
    }

    function mapStateToProps(state) {
        return { authenticated: state.auth.authenticated }
    }
    return withRouter(connect(mapStateToProps)(Authentication));
}
