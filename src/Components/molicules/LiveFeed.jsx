import { useSelector } from "react-redux";

function LiveFeed() {
    const feedData = useSelector((state) => state.orders.liveFeed);

    return (
        <div className="feed-container">
            <div className="header-section">
                <h1>Market Feed V3</h1>
            </div>
            <div className="feed-section">
                <div className="title">Feed</div>
                <div>
                    {feedData.map((data, index) => (
                        <div key={index} className="feed-item">
                            {JSON.stringify(data)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveFeed;
