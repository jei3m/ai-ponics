import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

function PrivateRoutes({ children }) {
    const { currentUser } = UserAuth(); // Get current user from context

    // Redirect to home page if user is not authenticated
    if (!currentUser) {
        return <Navigate to='/' replace={true} />;
    }

    // Render children if user is authenticated
    return children;
}

export default PrivateRoutes;
