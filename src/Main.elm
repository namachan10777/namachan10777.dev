port module Main exposing (Model)

import Browser
import Browser.Events
import Html exposing (..)
import Html.Attributes exposing (autofocus, class, href, id, src, value)
import Html.Events exposing (..)
import Json.Decode as Decode
import Os
import Task
import Time
import Types exposing (KeyValue)
import Util


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type alias Hist =
    ( String, String, Os.CmdResult )


type alias Model =
    { current : String
    , hists : List Hist
    , posix : Time.Posix
    , zone : Time.Zone
    , system : Os.System
    }


type Msg
    = Type KeyValue
    | ScrollBottom
    | SetSystemTime ( Time.Zone, Time.Posix )
    | SetCurrentTime Time.Posix
    | Change String


setSystemTime : Cmd Msg
setSystemTime =
    Task.perform SetSystemTime <| Task.map2 Tuple.pair Time.here Time.now


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = "help"
      , hists = []
      , posix = Time.millisToPosix 0
      , zone = Time.utc
      , system = Os.initialSystem
      }
    , setSystemTime
    )



-- UTIL
-- UPDATE


port scrollBottom : () -> Cmd msg


port focusInput : () -> Cmd msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Type (Types.Control "Enter") ->
            let
                inputs =
                    model.current |> String.split " " |> List.filter (\s -> s /= "")

                cmd =
                    List.head inputs |> Maybe.withDefault ""

                args =
                    List.tail inputs |> Maybe.withDefault []

                ( result, newSystem ) =
                    Os.exec model.system cmd args
            in
            case result of
                Os.Clear ->
                    ( { model
                        | current = ""
                        , hists = [ ( String.join "/" model.system.current, model.current, result ) ]
                        , system = newSystem
                      }
                    , Cmd.batch
                        [ scrollBottom ()
                        , focusInput ()
                        ]
                    )

                _ ->
                    ( { model
                        | current = ""
                        , hists = ( String.join "/" model.system.current, model.current, result ) :: model.hists
                        , system = newSystem
                      }
                    , Cmd.batch
                        [ scrollBottom ()
                        , focusInput ()
                        ]
                    )

        Type _ ->
            ( model, Cmd.none )

        Change s ->
            ( { model | current = s }, Cmd.none )

        ScrollBottom ->
            ( model, scrollBottom () )

        SetSystemTime ( zone, time ) ->
            ( { model | posix = time, zone = zone }, Cmd.none )

        SetCurrentTime time ->
            ( { model | posix = time }, Cmd.none )



-- VIEW


renderPrompt : String -> Html Msg
renderPrompt dir =
    span [] [ text (String.concat [ " ", dir, " # " ]) ]


toEnMonth : Time.Month -> String
toEnMonth month =
    case month of
        Time.Jan ->
            "Jan"

        Time.Feb ->
            "Feb"

        Time.Mar ->
            "Mar"

        Time.Apr ->
            "Apr"

        Time.May ->
            "May"

        Time.Jun ->
            "Jun"

        Time.Jul ->
            "Jul"

        Time.Aug ->
            "Aug"

        Time.Sep ->
            "Sep"

        Time.Oct ->
            "Oct"

        Time.Nov ->
            "Nov"

        Time.Dec ->
            "Dec"


renderPowerline : Model -> Html Msg
renderPowerline model =
    let
        zeroPadding n s =
            String.repeat (n - String.length s) "0" ++ s

        year =
            Time.toYear model.zone model.posix |> String.fromInt

        month =
            Time.toMonth model.zone model.posix |> toEnMonth

        day =
            Time.toDay model.zone model.posix |> String.fromInt

        hour =
            Time.toHour model.zone model.posix |> String.fromInt |> zeroPadding 2

        minute =
            Time.toMinute model.zone model.posix |> String.fromInt |> zeroPadding 2

        second =
            Time.toSecond model.zone model.posix |> String.fromInt |> zeroPadding 2
    in
    footer []
        [ span [ class "terminal-info" ] [ text "fish- 1:namachan10777*" ]
        , span [ class "time" ] [ text (month ++ " " ++ day ++ " " ++ year ++ " " ++ hour ++ ":" ++ minute ++ ":" ++ second) ]
        ]


renderStdout : List Os.Output -> Html Msg
renderStdout outputs =
    outputs
        |> List.map
            (\output ->
                case output of
                    Os.Str s ->
                        pre [ class "stdout" ] [ text s ]

                    Os.Img ( cssClass, imgSrc, Nothing ) ->
                        img [ class cssClass, src imgSrc ] []

                    Os.Img ( cssClass, imgSrc, Just ( author, link ) ) ->
                        div []
                            [ img [ class cssClass, src imgSrc ] []
                            , div []
                                [ span [] [ text "by " ]
                                , a [ href link ] [ text author ]
                                ]
                            ]
            )
        |> (\elements -> div [] elements)


renderHists : Model -> List (Html Msg)
renderHists model =
    model.hists
        |> List.map
            (\hist ->
                case hist of
                    ( dir, cmd, Os.Stdout outputs ) ->
                        div []
                            [ div [] [ renderPrompt dir, text cmd ]
                            , renderStdout outputs
                            ]

                    ( dir, cmd, _ ) ->
                        div [] [ renderPrompt dir, text cmd ]
            )


view : Model -> Html Msg
view model =
    let
        lists =
            div []
                [ renderPrompt (String.join "/" model.system.current)
                , input [ class "input", id "input", value model.current, onInput Change, autofocus True ] []
                ]
                :: renderHists model
    in
    div [ id "root" ]
        [ div [ id "scroll-area" ] (List.reverse lists)
        , renderPowerline model
        ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map Type Util.keyDecoder)
        , Time.every 1000 SetCurrentTime
        ]
