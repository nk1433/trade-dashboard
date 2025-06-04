import {
  Button, Box,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

const Refresh = ({ refreshScripts }) => {
  const dispatch = useDispatch();

  return (
    <Box>
      <Button style={{ color: 'black' }} onClick={() => dispatch(refreshScripts())}>
        Refresh
        <RefreshIcon ml={2} />
      </Button>
    </Box>
  );
};

Refresh.propTypes = {
  refreshScripts: PropTypes.func,
};

export default Refresh;