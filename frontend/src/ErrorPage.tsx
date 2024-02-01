import { useRouteError } from "react-router-dom"
import styles from './styles/ErrorPage.module.scss'

export default function ErrorPage() {
    const error = useRouteError() as {statusText: string, message: string};
    console.error(error)
    return(
        <div className={styles.errorPage}>
            <span className={styles.errorFont}>
                    {error.statusText || error.message}
            </span>
        </div>    
    )
}