import CustomBehaviorRegistry from "../../index.js";
    
export const attachBehaviorByQuery = new CustomBehaviorRegistry({
    // validate that the query selector is valid
    nameValidator: (name) => {
        try {
            document.querySelector(name);
            return true;
        } catch (e) {
            return false;
        }
    }
});

export default attachBehaviorByQuery;
