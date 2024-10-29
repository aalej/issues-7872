import * as functions from "firebase-functions/v1"
import admin from "firebase-admin"

admin.initializeApp()
const auth = admin.auth()
const firestore = admin.firestore()

export const initAdminUser = functions.auth.user().onCreate(async () => {
    const listUsersResult = await auth.listUsers(10);
    const user = listUsersResult.users.find((u) => u.email !== undefined);

    if (user) {
        const adminUserCountSnapshot = await firestore
            .collection("profiles")
            .where("roles", "array-contains", "admin")
            .limit(1)
            .count()
            .get();
        const { count: adminUserCount } = adminUserCountSnapshot.data();
        const adminUserExists = adminUserCount > 0;

        if (!adminUserExists) {
            console.warn("Creating admin user...", user);
            await firestore
                .collection("profiles")
                .doc(user.uid)
                .set({
                    roles: ["admin"],
                });

            console.log("Removing sign-up request for admin user...");
            const qSnapshot = await firestore
                .collection("signupRequests")
                .where("email", "==", user.email)
                .get();
            const docs = qSnapshot.docs;

            for (const doc of docs) {
                await doc.ref.delete();
            }
        }
    }
});