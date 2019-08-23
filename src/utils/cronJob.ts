import { CronJob } from 'cron';

export class Cron {

    public cron() {
        try {
            new CronJob('00 20 02 * * *', function () {
                console.log('You will see this message every second');
            }, null, true, 'America/Los_Angeles');

        } catch (e) {
            console.log('cron', e);
        }

    }

}
export default new Cron;
