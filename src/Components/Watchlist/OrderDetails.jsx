import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import "../../App.css";
import { Link } from '@mui/material';
import OrderPanel from './OrderPanel';

const OrderDetailsPortal = ({ children, data: script }) => {
    const [showPanel, setShowPanel] = useState(false);

    return (
        <>
            <Link onClick={() => setShowPanel(true)} sx={{ cursor: 'pointer' }}>
                {children}
            </Link>
            {showPanel && createPortal(
                <OrderPanel
                    open={showPanel}
                    onClose={() => setShowPanel(false)}
                    script={script}
                    currentPrice={script.ltp} // Assuming ltp is available in script data
                />,
                document.body
            )}
        </>
    );
};

OrderDetailsPortal.propTypes = {
    children: PropTypes.node,
    data: PropTypes.object,
};

export default OrderDetailsPortal;