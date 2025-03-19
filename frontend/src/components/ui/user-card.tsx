import React from "react";

export type User = {
    userId: string;
    numberOfChats: number;
    numberOfProjectsCreated: number;
    numberOfProjectsDeployed: number;
    maxChats?: number;
    maxCreated?: number;
    maxDeployed?: number;
};

type UserStatsProps = {
    user: User;
};

const UserStatsCard: React.FC<UserStatsProps> = ({ user }) => {
    return (
        <div>
            <div>
                <div className="flex flex-row">
                    <p>Chats: {`${user.numberOfChats} / ${user.maxChats} `}</p>
                    <p className="mr-2 ml-2">
                        {" "}
                        Created:{" "}
                        {`${user.numberOfProjectsCreated} / ${user.maxCreated} `}
                    </p>
                    <p>
                        {" "}
                        Deployments:{" "}
                        {`${user.numberOfProjectsDeployed} / ${user.maxDeployed}`}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserStatsCard;
