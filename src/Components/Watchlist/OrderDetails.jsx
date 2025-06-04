import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import "../../App.css";

const OrderDetails = ({ onClose }) => {

    return (
        <div className="modal">
            <div>I&#39;m a modal dialog</div>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

const OrderDetailsPortal = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button onClick={() => setShowModal(true)}>
                Show modal using a portal
            </button>
            {showModal && createPortal(
                <OrderDetails onClose={() => setShowModal(false)} />,
                document.body
            )}
        </>
    );
};


OrderDetails.propTypes = {
    onClose: PropTypes.func,
};

export default OrderDetailsPortal;