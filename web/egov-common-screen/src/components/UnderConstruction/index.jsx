
import 'bootstrap/dist/css/bootstrap.min.css';
import ucg from './ucs.jpg'
export default function UnderConstruction() {
    return (
        <>
            <style>{`
        h3 {
          text-align: center;
          color: red;
        }
        #ucg {
          width: 100%;
        }
      `}</style>

            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-10 main-title">
                        <h3 >The mSeva Punjab application will be unavailable from 15th August 2025 to 18th August 2025 due to scheduled maintenance. We regret the inconvenience and appreciate your understanding.</h3>
                        <img src={ucg} alt="Under Construction" id='ucg' />

                    </div>
                </div>

            </div>
        </>
    )
}
