import cron from "node-cron";
import { User } from "../models/db";

cron.schedule("22 3 1 1 *", async () => {
    try {
        console.log("Running cron job: Updating monthstatus and previousyear arrays");
        
        const users = await User.find();
        for (const user of users) {
            const { monthstatus } = user;
            
            // 12 months in previousyear
            user.previousyear = monthstatus.slice(0, 12);
            
            // Shifting the remaining months and fill with f
            user.monthstatus = [...monthstatus.slice(12), ...Array(12).fill(false)];

            // if(user.monthstatus.length){
            //     user.monthstatus=[true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
            //     user.previousyear= [true,true,true,true,true,true,true,true,true,true,true,true]
            // }
            
            await user.save();
        }
        
        console.log("Cron job completed successfully");
    } catch (error) {
        console.error("Error in cron job:", error);
    }
}, { timezone: "Asia/Kolkata"});
