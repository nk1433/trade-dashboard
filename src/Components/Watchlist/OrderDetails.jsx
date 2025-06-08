import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import "../../App.css";
import { Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WatchList from './Table';
import { useDispatch } from 'react-redux';
import { placeSLMOrder } from '../../Store/upstoxs';

const OrderDetails = ({ onClose, script }) => {
    const dispatch = useDispatch();

    return (
        <div className='modal'>
            <Box display={'flex'} alignItems={'end'} justifyContent={'end'}>
                <Button onClick={onClose}>
                    <CloseIcon />
                </Button>
            </Box>
            <Box display={'flex'} alignItems={'center'} justifyContent={'center'}>
                <Box sx={{ width: '500px' }}>
                    <WatchList scripts={script.allocationSuggestions} type='allocationSuggestions' />
                </Box>
            </Box>
            <Box display={'flex'} alignItems={'center'} justifyContent={'center'}>
                <Button onClick={() => { console.log("dis"); dispatch(placeSLMOrder(script)); }}>
                    Place Order
                </Button>
            </Box>
        </div>
    );
};

const OrderDetailsPortal = ({ children, data: script }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button onClick={() => setShowModal(true)}>
                {children}
            </button>
            {showModal && createPortal(
                <OrderDetails onClose={() => setShowModal(false)} script={script} />,
                document.body
            )}
        </>
    );
};

OrderDetails.propTypes = {
    onClose: PropTypes.any,
    script: PropTypes.object,
};
OrderDetailsPortal.propTypes = {
    children: PropTypes.node,
    data: PropTypes.object,
};

export default OrderDetailsPortal;